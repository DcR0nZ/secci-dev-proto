import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AddEmployeeDialog({ open, onOpenChange, onCreate }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [roleTag, setRoleTag] = React.useState("Driver");

  const reset = () => { setName(""); setEmail(""); setRoleTag("Driver"); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate({ name, email: email || undefined, roleTag });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Jane Smith" required />
          </div>
          <div className="space-y-2">
            <Label>Email (optional)</Label>
            <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleTag} onValueChange={setRoleTag}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Driver">Driver</SelectItem>
                <SelectItem value="Offsider">Offsider</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}