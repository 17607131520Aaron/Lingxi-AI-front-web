import { useState } from "react";
const useAIChat = () => {
  const [inputValue, setInputValue] = useState("");
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [messages, setMessages] = useState([]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(event.target.value);
  };

  const handleSend = (): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return { inputValue, isReplying, messages, handleInputChange, handleSend };
};

export default useAIChat;
