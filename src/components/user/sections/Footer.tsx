"use client";
"use no memo";

import { useNode, Element } from "@craftjs/core";
import React from "react";
import { UserContainer } from "../Container";
import { UserText } from "../Text";
import { UserButton } from "../Button";

export const UserFooter = () => {
  const { connectors: { connect, drag } } = useNode();
  
  return (
    <div ref={(ref: any) => connect(drag(ref))} className="w-full">
      <Element
        id="footer_container"
        is={UserContainer}
        canvas
        width="100%"
        background="#fcfbf9"
        padding={40}
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        gap={60}
      >
        <Element
            id="footer_help"
            is={UserButton}
            text="Help"
            variant="ghost"
            color="#333333"
            fontSize={16}
        />
        
        <Element
            id="footer_logo"
            is={UserText}
            text="Joy"
            fontSize={42}
            fontWeight="bold"
            fontFamily="serif"
            color="#000000"
            textAlign="center"
            margin={{ top: 0, bottom: 0, left: 40, right: 40 }}
        />
        
        <Element
            id="footer_about"
            is={UserButton}
            text="About"
            variant="ghost"
            color="#333333"
            fontSize={16}
        />
      </Element>
    </div>
  );
};

UserFooter.craft = {
  displayName: "Footer",
  props: {},
};
