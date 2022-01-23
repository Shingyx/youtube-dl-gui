import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import React, { Component } from 'react';
import { ToastContainer } from 'react-toastify';

import { DownloadService } from '../lib/download-service';
import { DownloadTable } from './DownloadTable';
import { UrlEntry } from './UrlEntry';

export class App extends Component {
    private downloadService: DownloadService = new DownloadService();

    public render(): JSX.Element {
        return (
            <div className="App">
                <UrlEntry downloadService={this.downloadService} />
                <DownloadTable downloadService={this.downloadService} />
                <ToastContainer autoClose={3000} hideProgressBar />
            </div>
        );
    }
}
