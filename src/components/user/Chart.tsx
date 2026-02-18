"use no memo";

import React from "react";
import { useNode } from "@craftjs/core";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface ChartProps {
    type?: "bar" | "line" | "pie";
    data?: any[];
    width?: string;
    height?: number;
    color?: string;
}

const DEFAULT_DATA = [
    { name: 'A', value: 400 },
    { name: 'B', value: 300 },
    { name: 'C', value: 300 },
    { name: 'D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const UserChart = ({
    type = "bar",
    data = DEFAULT_DATA,
    width = "100%",
    height = 300,
    color = "#8884d8"
}: ChartProps) => {
    const { connectors: { connect, drag } } = useNode();

    const renderChart = () => {
        switch (type) {
            case "line":
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke={color} activeDot={{ r: 8 }} />
                    </LineChart>
                );
            case "pie":
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            case "bar":
            default:
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill={color} />
                    </BarChart>
                );
        }
    };

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={{ width, height: `${height}px` }}
        >
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </div>
    );
};

const ChartSettings = () => {
    const { actions: { setProp }, type, data, color, height } = useNode((node) => ({
        type: node.data.props.type,
        data: node.data.props.data,
        color: node.data.props.color,
        height: node.data.props.height,
    }));

    const handleDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const parsed = JSON.parse(e.target.value);
            setProp((props: any) => props.data = parsed);
        } catch (error) {
            // ignore invalid json while typing
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Chart Type</Label>
                <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={type}
                    onChange={(e) => setProp((props: any) => props.type = e.target.value)}
                >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label>Main Color</Label>
                <div className="flex gap-2">
                    <Input type="color" value={color} className="w-10 h-10 p-1" onChange={(e) => setProp((props: any) => props.color = e.target.value)} />
                    <Input type="text" value={color} onChange={(e) => setProp((props: any) => props.color = e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Height</Label>
                <Input type="number" value={height} onChange={(e) => setProp((props: any) => props.height = parseInt(e.target.value))} />
            </div>

            <div className="space-y-2">
                <Label>Data (JSON)</Label>
                <Textarea
                    className="font-mono text-xs h-32"
                    defaultValue={JSON.stringify(data, null, 2)}
                    onChange={handleDataChange}
                />
            </div>
        </div>
    );
};

(UserChart as any).craft = {
    displayName: "Chart",
    props: {
        type: "bar",
        data: DEFAULT_DATA,
        width: "100%",
        height: 300,
        color: "#8884d8"
    },
    related: {
        settings: ChartSettings,
    },
};
