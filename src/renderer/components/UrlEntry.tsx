import { clipboard } from 'electron';
import React, { ChangeEvent, Component, FormEvent } from 'react';
import { downloadVideo } from '../lib/download-video';
import { isValidUrl } from '../lib/utilities';
import './UrlEntry.css';

interface IUrlEntryState {
    url: string;
    isValid: boolean;
}

export class UrlEntry extends Component<{}, IUrlEntryState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            url: '',
            isValid: false,
        };
        this.onUrlChanged = this.onUrlChanged.bind(this);
        this.pasteUrl = this.pasteUrl.bind(this);
        this.submit = this.submit.bind(this);
    }

    public render(): JSX.Element {
        return (
            <form className="UrlEntry" onSubmit={this.submit}>
                <div className="UrlEntry-formDiv">
                    <label>Video URL</label>
                    <input
                        className="UrlEntry-urlField"
                        type="text"
                        value={this.state.url}
                        onChange={this.onUrlChanged}
                    />
                    <input type="button" value="Paste URL" onClick={this.pasteUrl} />
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
        downloadVideo(this.state.url.trim());
        this.updateUrl('');
        event.preventDefault();
    }

    private updateUrl(url: string): void {
        const isValid = isValidUrl(url);
        this.setState({ url, isValid });
    }
}
