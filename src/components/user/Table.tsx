"use no memo";

import React from "react";
import { useNode } from "@craftjs/core";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface TableProps {
    data?: string[][];
    borderColor?: string;
    headerColor?: string;
}

const DEFAULT_DATA = [
    ["Header 1", "Header 2", "Header 3"],
    ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
    ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"],
];

export const UserTable = ({
    data = DEFAULT_DATA,
    borderColor = "#e5e7eb",
    headerColor = "#f3f4f6"
}: TableProps) => {
    const { connectors: { connect, drag } } = useNode();

    return (
        <div ref={(ref: any) => connect(drag(ref))} className="w-full overflow-x-auto">
            <table className="w-full border-collapse" style={{ borderColor }}>
                <thead>
                    <tr style={{ backgroundColor: headerColor }}>
                        {data[0]?.map((cell, i) => (
                            <th key={i} className="p-2 border text-left font-semibold" style={{ borderColor }}>{cell}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.slice(1).map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                                <td key={j} className="p-2 border" style={{ borderColor }}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TableSettings = () => {
    const { actions: { setProp }, data, borderColor, headerColor } = useNode((node) => ({
        data: node.data.props.data,
        borderColor: node.data.props.borderColor,
        headerColor: node.data.props.headerColor,
    }));

    const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            // Expecting CSV-like input or JSON
            const val = e.target.value;
            // Simple CSV parser for MVP
            const rows = val.split("\n").map(r => r.split(",").map(c => c.trim()));
            setProp((props: any) => props.data = rows);
        } catch (error) {
            // ignore
        }
    };

    const dataToString = (data: string[][]) => {
        return data.map(row => row.join(", ")).join("\n");
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Border Color</Label>
                <Input type="color" value={borderColor} className="h-10" onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label>Header Background</Label>
                <Input type="color" value={headerColor} className="h-10" onChange={(e) => setProp((props: any) => props.headerColor = e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label>Data (CSV format)</Label>
                <Textarea
                    className="font-mono text-xs h-32"
                    defaultValue={dataToString(data)}
                    onChange={handleDataChange}
                    placeholder="Header 1, Header 2&#10;Value 1, Value 2"
                />
            </div>
        </div>
    );
};

(UserTable as any).craft = {
    displayName: "Table",
    props: {
        data: DEFAULT_DATA,
        borderColor: "#e5e7eb",
        headerColor: "#f3f4f6"
    },
    related: {
        settings: TableSettings,
    },
};
