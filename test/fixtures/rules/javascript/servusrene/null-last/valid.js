export const find = (items, id) => {
    return !id ? items[0] : null;
};

export const label = (user) => !user.deleted ? user.name : null;
