export const f = async (items, load) => {
    for (const item of items) {
        await load(item);
    }
};
