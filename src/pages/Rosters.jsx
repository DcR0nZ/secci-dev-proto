import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import RosterBoard from "../components/rosters/RosterBoard";
import AddEmployeeDialog from "../components/rosters/AddEmployeeDialog";

export default function Rosters() {
  const qc = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [dateKey, setDateKey] = React.useState(() => new Date().toISOString().slice(0,10));
  const [addOpen, setAddOpen] = React.useState(false);

  React.useEffect(() => { (async()=>{ const me = await base44.auth.me(); setUser(me); })(); }, []);

  const { data: trucks = [] } = useQuery({
    queryKey: ["trucks", user?.tenantId],
    queryFn: () => base44.entities.Truck.filter({ tenantId: user.tenantId, isActive: true }),
    enabled: !!user
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["rosterEmployees", user?.tenantId],
    queryFn: () => base44.entities.RosterEmployee.filter({ tenantId: user.tenantId, isActive: true }),
    enabled: !!user
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["rosterAssignments", user?.tenantId, dateKey],
    queryFn: () => base44.entities.RosterAssignment.filter({ tenantId: user.tenantId, dateKey }),
    enabled: !!user && !!dateKey
  });

  const createEmployee = useMutation({
    mutationFn: async (payload) => {
      return base44.entities.RosterEmployee.create({ ...payload, tenantId: user.tenantId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rosterEmployees", user?.tenantId] })
  });

  const upsertAssignment = useMutation({
    mutationFn: async ({ employeeId, toTruckId, toTruckName, toIndex }) => {
      const existing = assignments.find(a => a.userId === employeeId);
      if (!toTruckId) {
        if (existing) { await base44.entities.RosterAssignment.delete(existing.id); }
        return null;
      }
      if (existing) {
        return base44.entities.RosterAssignment.update(existing.id, { truckId: toTruckId, truckName: toTruckName, position: toIndex });
      }
      return base44.entities.RosterAssignment.create({
        tenantId: user.tenantId,
        dateKey,
        truckId: toTruckId,
        truckName: toTruckName,
        userId: employeeId,
        userName: employees.find(e=>e.id===employeeId)?.name || "",
        position: toIndex
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rosterAssignments", user?.tenantId, dateKey] })
  });

  const reorderPositions = useMutation({
    mutationFn: async ({ truckId, orderedEmployeeIds }) => {
      const list = assignments.filter(a => a.truckId === truckId);
      // Update each assignment position to match new order
      await Promise.all(orderedEmployeeIds.map((eid, idx) => {
        const a = list.find(x => x.userId === eid);
        if (a) return base44.entities.RosterAssignment.update(a.id, { position: idx });
        return Promise.resolve();
      }));
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rosterAssignments", user?.tenantId, dateKey] })
  });

  if (!user) return null;
  const canAccess = user.role === 'admin' || user.appRole === 'tenantAdmin' || user.appRole === 'dispatcher';
  if (!canAccess) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold">Rosters</h1>
        <p className="text-gray-600 mt-2">You don't have access to view this page.</p>
      </div>
    );
  }

  const handleMove = async ({ employeeId, from, to, toIndex }) => {
    const toTruck = trucks.find(t => t.id === to);
    await upsertAssignment.mutateAsync({
      employeeId,
      toTruckId: toTruck ? toTruck.id : null,
      toTruckName: toTruck ? toTruck.name : null,
      toIndex: toIndex || 0
    });

    // After moving, re-sequence destination column
    if (toTruck) {
      const current = assignments.filter(a => a.truckId === toTruck.id).sort((a,b)=>(a.position||0)-(b.position||0));
      const newOrder = [...current.map(a => a.userId)];
      // insert/move employeeId to toIndex
      const without = newOrder.filter(id => id !== employeeId);
      without.splice(toIndex, 0, employeeId);
      await reorderPositions.mutateAsync({ truckId: toTruck.id, orderedEmployeeIds: without });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Rosters</h1>
          <p className="text-gray-600 text-sm">Assign delivery staff to trucks for {dateKey}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateKey}
            onChange={(e)=>setDateKey(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <Button className="gap-2" onClick={()=>setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      <RosterBoard
        dateKey={dateKey}
        employees={employees}
        trucks={trucks}
        assignments={assignments}
        onMove={handleMove}
      />

      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={async (payload) => {
          await createEmployee.mutateAsync(payload);
          setAddOpen(false);
        }}
      />
    </div>
  );
}