import { useState, useContext, createContext } from "react";
import StoryToolbar from "../components/StoryToolbar";
import StoryEditor from "../components/StoryEditor";
import Layout from "../components/layout";
import Head from "next/head";

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

const story = () => {
  const [newLineContent, setNewLineContent] = useState("");
  return (
    <>
      <Head>
        <title>Story Circle</title>
      </Head>
      <ClientContext.Provider
        value={{
          newLineContent: newLineContent,
          setNewLineContent: setNewLineContent,
        }}
      >
        <StoryEditor />
        <StoryToolbar />
      </ClientContext.Provider>
    </>
  );
};

story.getLayout = function getLayout(page: any) {
  return <Layout>{page}</Layout>;
};

export default story;
