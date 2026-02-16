"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { Toolbox } from "./Toolbox";
import { SettingsPanel } from "./SettingsPanel";
import { Topbar } from "./Topbar";
import { cn } from "@/lib/utils";

import { useAppContext } from "./AppContext";

export const Viewport = ({ children }: { children: React.ReactNode }) => {
    const { device } = useAppContext();
    const { connectors, enabled, actions } = useEditor((state) => ({
        enabled: state.options.enabled,
    }));

    const isMobile = device === "mobile";
    const DESIGN_WIDTH = 1024;
    const MOBILE_WIDTH = 375;
    const scale = isMobile ? MOBILE_WIDTH / DESIGN_WIDTH : 1;

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&display=swap"
                rel="stylesheet"
            />
            <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
                <Topbar />
                <div className="flex flex-1 overflow-hidden">
                    <div className={cn("w-64 bg-white flex-shrink-0 transition-all h-full flex flex-col overflow-hidden border-r min-h-0", enabled ? "opacity-100" : "opacity-50 pointer-events-none")}>
                        <Toolbox />
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 relative flex flex-col items-center craftjs-renderer">
                        <div
                            className={cn(
                                "bg-white shadow-lg transition-all duration-300 origin-top",
                                "w-full max-w-[1024px]",
                                enabled ? "ring-offset-2 ring-0" : "ring-0"
                            )}
                            style={isMobile ? {
                                width: `${DESIGN_WIDTH}px`,
                                transform: `scale(${scale})`,
                            } : undefined}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    if (enabled) {
                                        actions.selectNode(undefined);
                                    }
                                }
                            }}
                        >
                            {children}
                        </div>
                    </div>

                    <div className={cn("w-80 bg-white flex-shrink-0 border-l transition-all h-full flex flex-col overflow-hidden", enabled ? "translate-x-0" : "translate-x-full hidden")}>
                        <SettingsPanel />
                    </div>
                </div>
            </div>
        </>
    );
};
