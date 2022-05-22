import React, { FocusEvent, useRef, useState, useEffect } from "react";
import { Text } from "@chakra-ui/react";
import { useClientContext } from "../pages/story";
import { useStory } from "../lib/story";

const StoryNewLineField = () => {
  const { newLineContent, setNewLineContent } = useClientContext();
  const { key } = useStory();
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const defaultText = "Write here.";
  const textFieldRef = useRef<HTMLParagraphElement | null>(null);
  const focusOnTextField = () => {
    setIsWriting(true);
    textFieldRef.current?.focus();
  };
  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    setNewLineContent(e.target.innerText);
    setIsWriting(false);
  };
  const onFocus = (_: FocusEvent<HTMLInputElement>) => {
    setIsWriting(true);
  };
  const onInput = (e: FocusEvent<HTMLInputElement>) => {
    setNewLineContent(e.currentTarget.textContent || "");
  };
  /* manipulate the new line content when edits happen externally */
  useEffect(() => {
    if (textFieldRef.current && !isWriting) {
      textFieldRef.current.innerHTML = newLineContent;
    }
  }, [newLineContent, isWriting]);
  /* reset the new line content for new stories */
  useEffect(() => {
    if (textFieldRef.current && !isWriting) {
      setNewLineContent("");
    }
  }, [key]);
  return (
    <>
      <Text
        as="span"
        borderRadius={5}
        onClick={focusOnTextField}
        color="gray.400"
      >
        {!isWriting && newLineContent.replace(/\W*/, "") === "" && defaultText}
      </Text>
      <Text
        as={"span"}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={onInput}
        ref={textFieldRef}
        onBlur={onBlur}
        onFocus={onFocus}
        sx={{ whiteSpace: "pre-wrap" }}
      ></Text>
    </>
  );
};

export default StoryNewLineField;
