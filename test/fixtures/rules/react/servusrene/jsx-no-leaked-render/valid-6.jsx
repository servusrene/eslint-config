export const Status = ({a, b, c, d, e, f, g, h}) => (
    <div>
        {a ? (
            <span>a</span>
        ) : b ? (
            <span>b</span>
        ) : c && d ? (
            <span>c</span>
        ) : e ? (
            f ? (
                <span>f</span>
            ) : g && h ? (
                <span>h</span>
            ) : null
        ) : null}
    </div>
);
