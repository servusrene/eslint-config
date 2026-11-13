export const f = async (items, load) => {
    await Promise.all(items.map(load));
};
