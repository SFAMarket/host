export const sleep = async (time = 500) => {
    await new Promise((resolve) => setTimeout(resolve, time));
};
