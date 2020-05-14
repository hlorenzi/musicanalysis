import Editor from "./editor"
import Track from "./track"
import TrackStateManager from "./trackStateManager"
import TrackState from "./trackState"
import Rect from "../util/rect"
import Range from "../util/range"
import Project from "../project/project2"
import Rational from "../util/rational"
import CanvasUtils from "../util/canvasUtils"
import * as Theory from "../theory/theory"


type TrackKeyChangesState = TrackState


type UpdateHoverInput =
{
    mouse:
    {
        pos: { x: number, y: number }
    }
}


export default class TrackKeyChanges
{
    static knobWidth = 16
    static knobHeight = 22


    static init(state: TrackStateManager<TrackState>)
    {
        Track.init(state)
        state.mergeTrackState({
            type: "keyChanges",
        })
    }
	
	
	static updateHover(state: TrackStateManager<TrackKeyChangesState>, input: UpdateHoverInput)
	{
        const checkRange = Editor.timeRangeAtX(
            state.contentStateManager,
            input.mouse.pos.x - TrackKeyChanges.knobWidth,
            input.mouse.pos.x + TrackKeyChanges.knobWidth)

        let hover = null
        
        for (const keyCh of TrackKeyChanges.iterAtRange(state, checkRange))
        {
            const rect = TrackKeyChanges.knobRectForKeyChange(state, keyCh.time)
            if (rect.contains(input.mouse.pos))
            {
                hover =
                {
                    id: keyCh.id,
                    range: Range.fromPoint(keyCh.time),
                    action: Editor.actionDragTime,
                }
            }
        }

        state.mergeContentState({
            mouse: {
                ...state.contentState.mouse,
                hover,
            }
        })
	}


    static *iterAtRange(state: TrackStateManager<TrackKeyChangesState>, range: Range): Generator<Project.KeyChange, void, void>
    {
        const trackElems = state.appState.project.timedLists.get(state.trackState.trackId)
        if (!trackElems)
            return

        for (const keyCh of trackElems.iterAtRange(range))
            yield keyCh as Project.KeyChange
    }
	
	
	static knobRectForKeyChange(state: TrackStateManager<TrackKeyChangesState>, time: Rational)
	{
        return new Rect(
            Editor.xAtTime(state.contentStateManager, time) - TrackKeyChanges.knobWidth / 2,
            0,
            TrackKeyChanges.knobWidth,
            TrackKeyChanges.knobHeight)
	}


    static render(state: TrackStateManager<TrackKeyChangesState>, ctx: CanvasRenderingContext2D)
    {
        const visibleRange = Editor.visibleTimeRange(state.contentStateManager)

		for (const keyCh of TrackKeyChanges.iterAtRange(state, visibleRange))
			TrackKeyChanges.renderKeyChange(state, ctx, keyCh)
    }
	
	
	static renderKeyChangeKnob(state: TrackStateManager<TrackKeyChangesState>, ctx: CanvasRenderingContext2D, time: Rational)
	{
		const rect = TrackKeyChanges.knobRectForKeyChange(state, time)
		
		ctx.fillStyle = state.appState.prefs.editor.keyChangeColor
		
		ctx.beginPath()
		ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, Math.PI * 2)
		ctx.fill()
	}
	
	
	static renderKeyChange(state: TrackStateManager<TrackKeyChangesState>, ctx: CanvasRenderingContext2D, keyCh: Project.KeyChange)
	{
		const rect = TrackKeyChanges.knobRectForKeyChange(state, keyCh.time)
		
		ctx.fillStyle = state.appState.prefs.editor.keyChangeColor
		
		ctx.beginPath()
		ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, Math.PI * 2)
		ctx.fill()
		
		ctx.font = "14px Verdana"
		ctx.textAlign = "left"
		ctx.textBaseline = "middle"
		ctx.fillText(keyCh.key.str, rect.x + rect.w + 5, rect.y + rect.h / 2)
		
		if (state.appState.selection.has(keyCh.id))
		{
			ctx.globalAlpha = 0.75
			ctx.fillStyle = "#fff"
			
			ctx.beginPath()
			ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2 - 3, 0, Math.PI * 2)
			ctx.fill()
			
			ctx.globalAlpha = 1
		}
		
		const hover = state.contentState.mouse.hover
		if (hover && hover.id === keyCh.id)
		{
			ctx.globalAlpha = 0.5
			ctx.fillStyle = "#fff"
			
			ctx.beginPath()
			ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, Math.PI * 2)
			ctx.fill()
			
			ctx.globalAlpha = 1
		}
	}
}