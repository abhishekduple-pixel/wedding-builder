"use client";

import React from "react";
import { Frame, Element } from "@craftjs/core";
import { AppProvider } from "@/components/editor/AppContext";
import { EditorProvider } from "@/components/editor/EditorProvider";
import { Viewport } from "@/components/editor/Viewport";
import { UserContainer } from "@/components/user/Container";
import { UserText } from "@/components/user/Text";

export default function Home() {
  return (
    <AppProvider>
      <EditorProvider>
        <Viewport>
          <Frame>
            <Element is={UserContainer} canvas background="#ffffff" padding={10} minHeight="800px" width="100%">
              {/* <UserText text="Welcome to our Wedding!" fontSize={32} /> */}
              <UserText text="Drag components from the left to start checking." fontSize={16} />
            </Element>
          </Frame>
        </Viewport>
      </EditorProvider>
    </AppProvider>
  );
}
