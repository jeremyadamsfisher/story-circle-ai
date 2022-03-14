import { Text } from "@chakra-ui/react";
import React, { FocusEvent, useRef, useState } from "react";

const defaultText = "Write here.";

// const WriteField = (setCurrentSegmentContent: (s: string) => void) => {
//   const updateWriteFieldState = (e: FocusEvent<HTMLInputElement>) => {
//     const content = e.target.innerText;
//     if (content === defaultText) {
//       e.target.innerText = "";
//     } else {
//       setCurrentSegmentContent(content);
//     }
//   };
//   return (
//     <Text
//       as="span"
//       borderRadius="5"
//       contentEditable={true}
//       suppressContentEditableWarning={true}
//       color="gray.400"
//       onBlur={updateWriteFieldState}
//       onFocus={updateWriteFieldState}
//     >
//       {defaultText}
//     </Text>
//   );
// };

// /*Child Component*/
// const Child = ({ acresRef }: { acresRef: any }) => (
//   <>
//     <div hidden={false}>
//       <label htmlFor="address">Address</label>
//       <input type="text" name="address" ref={acresRef} />
//     </div>
//   </>
// );

// /* Parent Component */
// const Parent = () => {
//   const acresRef = useRef<HTMLHeadingElement>();

//   const acresFocus = () => {
//     acresRef.current?.focus();
//   };

//   return (
//     <>
//       <Child acresRef={acresRef} />
//       <button onClick={acresFocus}>acres</button>
//     </>
//   );
// };

// export default Parent;

const WriteField = ({
  content,
  setContent,
}: {
  content: string;
  setContent: (content: string) => void;
}) => {
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const textFieldRef = useRef<HTMLParagraphElement | null>(null);

  const focusOnTextField = () => {
    setIsWriting(true);
    textFieldRef.current?.focus();
  };

  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    setContent(e.target.innerText);
    setIsWriting(false);
  };

  const onFocus = (_: FocusEvent<HTMLInputElement>) => {
    setIsWriting(true);
  };

  return (
    <>
      <Text
        as="span"
        borderRadius={5}
        onClick={focusOnTextField}
        color="gray.400"
      >
        {!isWriting && content === "" && defaultText}
      </Text>
      <Text
        as="span"
        borderRadius={5}
        contentEditable={true}
        suppressContentEditableWarning={true}
        ref={textFieldRef}
        onBlur={onBlur}
        onFocus={onFocus}
      ></Text>
    </>
  );
};

export default WriteField;
