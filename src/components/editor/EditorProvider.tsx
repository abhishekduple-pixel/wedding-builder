"use client";

import React from "react";
import { Editor } from "@craftjs/core";
import { RenderNode } from "./RenderNode";
import { UserText } from "../user/Text";
import { UserContainer } from "../user/Container";
import { UserImage } from "../user/Image";
import { UserVideo } from "../user/Video";
import { UserPopup } from "../user/Popup";
import { UserButton } from "../user/Button";
import { UserInput } from "../user/Input";
import { UserLabel } from "../user/Label";
import { UserTextarea } from "../user/Textarea";
import { UserSwitch } from "../user/Switch";
import { UserSlider } from "../user/Slider";
import { UserAnimatedShape } from "../user/AnimatedShape";
import { UserChart } from "../user/Chart";
import { UserTable } from "../user/Table";
import { UserEmoji } from "../user/Emoji";
// We will import more components here as we build them

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <Editor
            resolver={{
                UserText,
                UserContainer,
                UserImage,
                UserVideo,
                UserPopup,
                UserButton,
                UserInput,
                UserLabel,
                UserTextarea,
                UserSwitch,
                UserSlider,
                UserAnimatedShape,
                UserChart,
                UserTable,
                UserEmoji,
            }}
            onRender={RenderNode}
        >
            {children}
        </Editor>
    );
};
