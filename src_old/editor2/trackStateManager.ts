import { AppState, ContentManager, AppReducer } from "../AppState"
import EditorState from "./editorState"
import TrackState from "./trackState"


export default class TrackStateManager<T>
{
    contentStateManager: ContentManager<EditorState>
    trackIndex: number


    constructor(contentStateManager: ContentManager<EditorState>, trackIndex: number)
    {
        this.contentStateManager = contentStateManager
        this.trackIndex = trackIndex
    }


    get appState(): AppState
    {
        return this.contentStateManager.appState
    }


    mergeAppState(newState: Partial<AppState>)
    {
        this.contentStateManager.appState = AppReducer.merge(this.contentStateManager.appState, newState)
    }


    get contentState(): EditorState
    {
        return this.contentStateManager.contentState
    }


    set contentState(newState: EditorState)
    {
        this.contentStateManager.contentState = newState
    }


    mergeContentState(newState: Partial<EditorState>)
    {
        this.contentStateManager.mergeContentState(newState)
    }


    get trackState(): T
    {
        return this.contentStateManager.contentState.tracks[this.trackIndex] as any as T
    }


    set trackState(newState: T)
    {
        this.contentStateManager.mergeContentState({
            tracks: [
                ...this.contentStateManager.contentState.tracks.slice(0, this.trackIndex),
                newState as any as TrackState,
                ...this.contentStateManager.contentState.tracks.slice(this.trackIndex + 1),
            ]
        })
    }


    mergeTrackState(newState: Partial<T>)
    {
        this.trackState = {
            ...this.trackState,
            ...newState,
        }
    }
}