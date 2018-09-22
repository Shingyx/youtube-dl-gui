import React, { Component } from 'react';
import { downloadVideo } from '../lib/download-video';
import './App.css';
import { UrlEntry } from './UrlEntry';

export class App extends Component {
    public render(): JSX.Element {
        return (
            <div className="App">
                <UrlEntry onSubmit={(url) => this.onSubmit(url)} />
                <p className="App-intro">
                    To get started, edit <code>src/App.tsx</code> and save to reload.
                </p>
            </div>
        );
    }

    private onSubmit(url: URL): void {
        downloadVideo(url);
    }
}
