import {useMemo} from 'react';

const sanitizeHtml = (html) => html;

export const SafeHtml = ({html, ...props}) => {
    const clean = useMemo(() => sanitizeHtml(html), [html]);

    return <div {...props} dangerouslySetInnerHTML={{__html: clean}} />;
};
