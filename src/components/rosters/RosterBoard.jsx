import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import EmployeeCard from "./EmployeeCard";

function Column({ droppableId, title, items }) {
  return (
    <div className="flex-1 min-w-[260px] bg-gray-50 border rounded-lg p-3">
      <div className="font-semibold text-sm mb-2 px-1">{title}</div>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2 min-h-[120px]">
            {items.map((emp, index) => (
              <Draggable key={emp.id} draggableId={emp.id} index={index}>
                {(dragProvided) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                    <EmployeeCard employee={emp} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function RosterBoard({ dateKey, employees, trucks, assignments, onMove }) {
  // Build columns content from employees + assignments
  const assignedByTruck = React.useMemo(() => {
    const map = {};
    trucks.forEach(t => { map[t.id] = []; });
    const assignedSet = new Set();

    (assignments || []).forEach(a => {
      if (a.truckId && map[a.truckId]) {
        const emp = employees.find(e => e.id === a.userId);
        if (emp) {
          map[a.truckId].push({ ...emp, _position: a.position || 0 });
          assignedSet.add(emp.id);
        }
      }
    });
    Object.keys(map).forEach(tid => map[tid].sort((a,b)=> (a._position||0)-(b._position||0)));

    const unassigned = employees.filter(e => !assignedSet.has(e.id));
    return { map, unassigned };
  }, [employees, trucks, assignments]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    onMove({
      employeeId: draggableId,
      from: source.droppableId,
      to: destination.droppableId,
      toIndex: destination.index
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3">
        <Column droppableId="unassigned" title="Unassigned" items={assignedByTruck.unassigned} />
        {trucks.map((t) => (
          <Column key={t.id} droppableId={t.id} title={t.name} items={assignedByTruck.map[t.id] || []} />
        ))}
      </div>
    </DragDropContext>
  );
}