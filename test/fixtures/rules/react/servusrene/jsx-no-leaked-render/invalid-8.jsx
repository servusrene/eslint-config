export const Status = ({a, b, c, d, e, f}) => (
    <div>
        {a ? (
            b ? (
                c ? (
                    <span>c</span>
                ) : (
                    d || (e && f && <span>f</span>)
                )
            ) : null
        ) : null}
    </div>
);
