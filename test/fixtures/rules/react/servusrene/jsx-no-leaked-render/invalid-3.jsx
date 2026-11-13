import {Link} from 'react-router';

export const Cancel = ({error, isCanceled, appointment}) => (
    <div>
        {error ? (
            <div className="alert bg-warning" role="alert">
                {error}
            </div>
        ) : (
            isCanceled &&
            appointment && (
                <div>
                    <div className="alert bg-success" role="alert">
                        Termin wurde erfolgreich storniert.
                    </div>
                    <Link to="/" aria-label="Zur Startseite" className="btn btn-primary">
                        Zurück zur Startseite
                    </Link>
                </div>
            )
        )}
    </div>
);
