const Label = ({text}) => (
    <span>{text}</span>
);

const Badge = ({text}) => (
    <Label text={text} />
);

export default Badge;
