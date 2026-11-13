import {useEffect, useState} from 'react';

export function Counter({count}: {count: number}) {
    const [value, setValue] = useState(count);
    if (count > 1) {
        useEffect(() => setValue(count));
    }
    return <div>{value && <span>{value}</span>}</div>;
}

export const Clean = ({label}: {label: string}) => (
    <button type="button" disabled={true}>
        {label}
    </button>
);
