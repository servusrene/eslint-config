export const List = ({items}) => (
    <ul>
        {items.map((item) => (
            <li key={item}>{item}</li>
        ))}
    </ul>
);
