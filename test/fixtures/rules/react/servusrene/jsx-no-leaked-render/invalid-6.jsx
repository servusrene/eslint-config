export const Foo = ({a, b}) => <>{a ?? (b && <span />)}</>;
