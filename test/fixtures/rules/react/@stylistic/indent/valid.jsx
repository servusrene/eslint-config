const Bar = () => <i />;

export const Foo = ({a}) => (
    <div>
        <Bar title="a"
             id="b" />
        {a ? (
            <Bar title="a"
                 id="b" />
        ) : null}
    </div>
);
