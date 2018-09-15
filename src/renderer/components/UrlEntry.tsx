import { ipcRenderer } from 'electron';
import React, { ChangeEvent, Component, FormEvent } from 'react';
import { isValidUrl } from '../../common/common-utilities';
import { Events } from '../../common/events';
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
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    public render(): JSX.Element {
        return (
            <form className="UrlEntry" onSubmit={this.handleSubmit}>
                <div className="UrlEntry-formDiv">
                    <label>Video URL</label>
                    <input
                        className="UrlEntry-textField"
                        type="text"
                        value={this.state.url}
                        onChange={this.handleChange}
                    />
                </div>
                <div>
                    <input type="submit" value="Start" disabled={!this.state.isValid} />
                </div>
            </form>
        );
    }

    public handleChange(event: ChangeEvent<HTMLInputElement>): void {
        const url = event.target.value;
        const isValid = isValidUrl(url);
        this.setState({ url, isValid });
    }

    public handleSubmit(event: FormEvent): void {
        ipcRenderer.send(Events.DOWNLOAD_VIDEO, this.state.url);
        this.setState({
            url: '',
            isValid: false,
        });
        event.preventDefault();
    }
}
