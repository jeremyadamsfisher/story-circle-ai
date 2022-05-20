import { useState, useContext, createContext } from "react";
import StoryToolbar from "../components/StoryToolbar";
import StoryEditor from "../components/StoryEditor";

//@ts-ignore
const ClientContext = createContext<{
  newLineContent: string;
  setNewLineContent: (newLineContent: string) => void;
}>();

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("use useClientContext in a context provider");
  }
  return context;
};

export default () => {
  const [newLineContent, setNewLineContent] = useState("");
  return (
    <ClientContext.Provider
      value={{
        newLineContent: newLineContent,
        setNewLineContent: setNewLineContent,
      }}
    >
      <StoryEditor />
      <StoryToolbar />
    </ClientContext.Provider>
  );
};
