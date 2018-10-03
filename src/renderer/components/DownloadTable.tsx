import React, { Component } from 'react';
import { AutoSizer, Column, Table } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { DownloadService } from '../lib/download-service';
import { IVideoDownloadState } from '../lib/video-download';

interface IDownloadTableProps {
    downloadService: DownloadService;
}

interface IDownloadTableState {
    rows: IVideoDownloadState[];
}

export class DownloadTable extends Component<IDownloadTableProps, IDownloadTableState> {
    public state: IDownloadTableState = {
        rows: [],
    };

    constructor(props: IDownloadTableProps, context?: any) {
        super(props, context);
        this.props.downloadService.addDownloadStartedListener((downloadTask) => {
            const rows = this.state.rows;
            const index = rows.length; // TODO key by something else to support removing rows
            rows[index] = downloadTask.getState();
            this.setState({ rows });
            downloadTask.addStateChangedListener((state) => {
                rows[index] = state;
                this.setState({ rows });
            });
        });
    }

    public render(): JSX.Element {
        return (
            <AutoSizer>
                {({ height, width }) => {
                    const header = document.getElementById('UrlEntry');
                    if (header) {
                        height -= header.scrollHeight;
                    }
                    return (
                        <Table
                            headerHeight={30}
                            height={height}
                            width={width}
                            rowCount={this.state.rows.length}
                            rowGetter={({ index }) => this.state.rows[index]}
                            rowHeight={40}
                        >
                            <Column
                                dataKey={'video'}
                                flexGrow={1}
                                flexShrink={1}
                                width={1}
                                label={'Video'}
                            />
                            <Column dataKey={'progress'} width={150} label={'Progress'} />
                            <Column dataKey={'status'} width={200} label={'Status'} />
                            <Column dataKey={'speed'} width={100} label={'Speed'} />
                            <Column dataKey={'eta'} width={80} label={'ETA'} />
                        </Table>
                    );
                }}
            </AutoSizer>
        );
    }
}
