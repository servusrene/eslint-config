export const Foo = ({a}) => {
    const visible = a && a.length > 0;
    return visible ? <span /> : null;
};
