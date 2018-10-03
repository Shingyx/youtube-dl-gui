import React, { Component } from 'react';
import { DownloadService } from '../lib/download-service';
import './App.css';
import { DownloadTable } from './DownloadTable';
import { UrlEntry } from './UrlEntry';

export class App extends Component {
    private downloadService: DownloadService = new DownloadService();

    public render(): JSX.Element {
        return (
            <div className="App">
                <UrlEntry downloadService={this.downloadService} />
                <DownloadTable downloadService={this.downloadService} />
            </div>
        );
    }
}
