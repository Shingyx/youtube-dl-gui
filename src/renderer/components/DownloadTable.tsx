import React, { Component } from 'react';
import { AutoSizer, Column, Table, WindowScroller } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { DownloadService } from '../lib/download-service';
import { IVideoDownloadState } from '../lib/video-download';
import './DownloadTable.css';

// tslint:disable-next-line:no-var-requires
const { Line } = require('rc-progress');

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
            <div className={'DownloadTable'}>
                <WindowScroller>
                    {({ height }) => (
                        <AutoSizer disableHeight>
                            {({ width }) => this.renderTable({ height, width })}
                        </AutoSizer>
                    )}
                </WindowScroller>
            </div>
        );
    }

    private renderTable({ height, width }: { height: number; width: number }): JSX.Element {
        return (
            <Table
                autoHeight
                headerHeight={30}
                height={height}
                width={width}
                rowCount={this.state.rows.length}
                rowGetter={({ index }) => this.state.rows[index]}
                rowHeight={35}
                className={'Table'}
                rowClassName={({ index }) => {
                    return index < 0 ? 'headerRow' : index % 2 === 0 ? 'evenRow' : 'oddRow';
                }}
            >
                <Column
                    dataKey={'video'}
                    flexGrow={1}
                    flexShrink={1}
                    width={1}
                    label={'Video'}
                    className={'videoColumn'}
                />
                <Column
                    dataKey={'progress'}
                    width={150}
                    label={'Progress'}
                    cellRenderer={({ rowData }) => (
                        <Line
                            percent={(rowData as IVideoDownloadState).progress * 100}
                            strokeWidth={8}
                            trailWidth={8}
                        />
                    )}
                />
                <Column dataKey={'status'} width={200} label={'Status'} />
                <Column dataKey={'speed'} width={100} label={'Speed'} className={'unitsColumn'} />
                <Column dataKey={'eta'} width={60} label={'ETA'} className={'unitsColumn'} />
            </Table>
        );
    }
}
