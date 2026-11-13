export const Status = ({a, b, c, d, e, f, g, h, i, j, k}) => (
    <div>
        {a ? (
            <span>a</span>
        ) : b ? (
            <span>b</span>
        ) : c ? (
            <span>c</span>
        ) : d ? (
            <span>d</span>
        ) : e ? (
            <span>e</span>
        ) : f ? (
            <span>f</span>
        ) : (
            g &&
            h &&
            i &&
            j &&
            k && (
                <span>k</span>
            )
        )}
    </div>
);
