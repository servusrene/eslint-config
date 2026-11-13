interface Props {
    name: string,
    age: number
}

const unusedValue: any = 1;

export const greet = (props: Props): string => `Hello ${props.name}`;
