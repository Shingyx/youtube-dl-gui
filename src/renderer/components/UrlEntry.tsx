import { clipboard } from 'electron';
import React, { ChangeEvent, Component, FormEvent } from 'react';
import { isValidUrl } from '../lib/utilities';
import './UrlEntry.css';

interface IUrlEntryProps {
    onSubmit: (url: URL) => void;
}

interface IUrlEntryState {
    urlText: string;
    isValid: boolean;
}

export class UrlEntry extends Component<IUrlEntryProps, IUrlEntryState> {
    public state: IUrlEntryState = {
        urlText: '',
        isValid: false,
    };

    public render(): JSX.Element {
        return (
            <form className="UrlEntry" onSubmit={(event) => this.submit(event)}>
                <div className="UrlEntry-formDiv">
                    <label>Video URL</label>
                    <input
                        className="UrlEntry-urlField"
                        type="text"
                        value={this.state.urlText}
                        onChange={(event) => this.onUrlChanged(event)}
                    />
                    <input type="button" value="Paste URL" onClick={() => this.pasteUrl()} />
                </div>
                <div>
                    <input type="submit" value="Start" disabled={!this.state.isValid} />
                </div>
            </form>
        );
    }

    private onUrlChanged(event: ChangeEvent<HTMLInputElement>): void {
        this.updateUrl(event.target.value);
    }

    private pasteUrl(): void {
        this.updateUrl(clipboard.readText());
    }

    private submit(event: FormEvent): void {
        this.props.onSubmit(new URL(this.state.urlText.trim()));
        this.updateUrl('');
        event.preventDefault();
    }

    private updateUrl(urlText: string): void {
        const isValid = isValidUrl(urlText);
        this.setState({ urlText, isValid });
    }
}
