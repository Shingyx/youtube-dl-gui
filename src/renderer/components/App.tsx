import React, { Component } from 'react';
import './App.css';
import { UrlEntry } from './UrlEntry';

export class App extends Component {
    public render(): JSX.Element {
        return (
            <div className="App">
                <UrlEntry />
                <p className="App-intro">
                    To get started, edit <code>src/App.tsx</code> and save to reload.
                </p>
            </div>
        );
    }
}
