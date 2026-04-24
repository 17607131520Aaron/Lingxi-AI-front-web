const useAiChat = () => {
  return {
    sendMessage: (message: string) => {
      console.log(message);
    },
  };
};

export default useAiChat;