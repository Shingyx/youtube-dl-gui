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
    downloadStates: { [id: number]: IVideoDownloadState };
    currentIds: number[];
}

export class DownloadTable extends Component<IDownloadTableProps, IDownloadTableState> {
    public state: IDownloadTableState = {
        downloadStates: {},
        currentIds: [],
    };
    private nextId: number = 0;

    constructor(props: IDownloadTableProps, context?: any) {
        super(props, context);
        this.props.downloadService.addDownloadStartedListener((downloadTask) => {
            const id = this.nextId;
            this.setState({
                downloadStates: {
                    ...this.state.downloadStates,
                    [id]: downloadTask.getState(),
                },
                currentIds: [...this.state.currentIds, id],
            });
            downloadTask.addStateChangedListener((state) => {
                this.setState({
                    downloadStates: {
                        ...this.state.downloadStates,
                        [id]: state,
                    },
                });
            });
            this.nextId++;
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
                rowCount={this.state.currentIds.length}
                rowGetter={({ index }) => this.state.downloadStates[this.state.currentIds[index]]}
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
