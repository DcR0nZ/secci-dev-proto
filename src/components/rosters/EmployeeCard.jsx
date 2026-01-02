import React from "react";
import { Badge } from "@/components/ui/badge";

export default function EmployeeCard({ employee }) {
  return (
    <div className="bg-white border rounded-md p-2 shadow-sm hover:shadow transition-all">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm truncate">{employee.name}</div>
        {employee.roleTag && (
          <Badge className="text-[10px] py-0 px-1 capitalize">{employee.roleTag}</Badge>
        )}
      </div>
      {employee.email && (
        <div className="text-[11px] text-gray-500 truncate mt-0.5">{employee.email}</div>
      )}
    </div>
  );
}