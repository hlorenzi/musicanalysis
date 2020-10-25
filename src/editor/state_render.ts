import * as Editor from "./index"
import * as Project from "../project"
import * as Theory from "../theory"
import Rational from "../util/rational"
import Range from "../util/range"
import Rect from "../util/rect"


export function render(data: Editor.EditorUpdateData)
{
    data.ctx.save()
    
    data.ctx.fillStyle = data.prefs.editor.bkgColor
    data.ctx.fillRect(0, 0, data.state.renderRect.w, data.state.renderRect.h)

    data.ctx.save()
    data.ctx.beginPath()
    data.ctx.rect(
        data.state.trackHeaderW,
        0,
        data.state.renderRect.w - data.state.trackHeaderW,
        data.state.renderRect.h)
    data.ctx.clip()

    //Editor.renderCursorHighlight(state, ctx)
    renderBackgroundMeasures(data)

    data.ctx.restore()
    
    let y = -data.state.trackScroll
    for (let t = 0; t < data.state.tracks.length; t++)
    {
        data.ctx.save()
        data.ctx.translate(0, y)
        
        data.ctx.beginPath()
        data.ctx.rect(
            data.state.trackHeaderW,
            1,
            data.state.renderRect.w - data.state.trackHeaderW,
            data.state.tracks[t].renderRect.h - 1)
        data.ctx.clip()

        //data.ctx.translate(0, -data.state.tracks[t].yScroll)

        //Editor.renderRectCursorHighlight(state, ctx, t)
        data.state.tracks[t].render(data)
        //Editor.renderRectCursorContour(state, ctx, t)

        data.ctx.restore()

        const y2 = y + data.state.tracks[t].renderRect.h
        
        data.ctx.strokeStyle = data.prefs.editor.trackHBorderColor
        data.ctx.beginPath()
        data.ctx.moveTo(0, y + 0.5)
        data.ctx.lineTo(data.state.renderRect.w, y + 0.5)
        data.ctx.moveTo(0, y2 + 0.5)
        data.ctx.lineTo(data.state.renderRect.w, y2 + 0.5)
        data.ctx.stroke()

        y = y2
    }
    
    data.ctx.save()
    data.ctx.translate(data.state.trackHeaderW, 0)

    data.ctx.beginPath()
    data.ctx.rect(
        0,
        0,
        data.state.renderRect.w - data.state.trackHeaderW,
        data.state.renderRect.h)
    data.ctx.clip()

    /*if (data.state.cursor.visible)
    {
        const timeMin = data.state.cursor.time1.min(data.state.cursor.time2)!
        const timeMax = data.state.cursor.time1.max(data.state.cursor.time2)!
        Editor.renderCursorBeam(state, ctx, timeMin, false)
        Editor.renderCursorBeam(state, ctx, timeMax, true)
    }
    
    if (data.state.appState.playback.playing)
        Editor.renderPlaybackBeam(state, ctx, data.state.appState.playback.time)*/

    data.ctx.restore()
    
    data.ctx.strokeStyle = data.prefs.editor.trackVBorderColor
    data.ctx.beginPath()
    data.ctx.moveTo(data.state.trackHeaderW + 0.5, 0)
    data.ctx.lineTo(data.state.trackHeaderW + 0.5, data.state.renderRect.h)
    data.ctx.stroke()

    data.ctx.restore()
}


function renderBackgroundMeasures(data: Editor.EditorUpdateData)
{
    const visibleRange = Editor.visibleTimeRange(data)
    
    //const meterChangeTrackId = Project.meterChangeTrackForTrack(data.state.appState.project, 0)
    //const meterChangeList = data.state.appState.project.timedLists.get(meterChangeTrackId)!

    for (let [meterCh1Raw, meterCh2Raw] of [[null as Project.MeterChange | null, null as Project.MeterChange | null]])// meterChangeList.iterActiveAtRangePairwise(visibleRange))
    {
        meterCh1Raw = new Project.MeterChange(0, Range.fromPoint(new Rational(0)), new Theory.Meter(4, 4))

        let timeMin = (meterCh1Raw ? meterCh1Raw.range.start : null)
        let timeMax = (meterCh2Raw ? meterCh2Raw.range.start : visibleRange.end)

        let measureAlternate = true

        let meterCh1 = meterCh1Raw as (Project.MeterChange | null)
        let meterCh2 = meterCh2Raw as (Project.MeterChange | null)

        if (!meterCh1)
        {
            if (!meterCh2)
                continue
            
            meterCh1 = meterCh2
            timeMin = meterCh2.range.start
            while (timeMin.compare(visibleRange.start) > 0)
            {
                timeMin = timeMin.subtract(meterCh2.meter.fullCycleDuration)

                if (meterCh2.meter.alternatingMeasureCount % 2 != 0)
                    measureAlternate = !measureAlternate
            }
        }
        
        const meterCh1X = 0.5 + Math.floor(Editor.xAtTime(data, timeMin!))
        const meterCh2X = 0.5 + Math.floor(Editor.xAtTime(data, timeMax))

        data.ctx.strokeStyle = data.prefs.editor.meterChangeColor
        data.ctx.lineCap = "square"
        data.ctx.lineWidth = 1
        
        for (const [measureN, measureD, time1, time2] of meterCh1.meter.iterMeasuresPairwise(timeMin))
        {
            measureAlternate = !measureAlternate

            if (time2.compare(visibleRange.start) < 0)
                continue

            if (time1.compare(timeMax) > 0 || time1.compare(visibleRange.end) > 0)
                break

            const measureX1 = 0.5 + Math.floor(Editor.xAtTime(data, time1))
            const measureX2 = 0.5 + Math.floor(Editor.xAtTime(data, time2))

            if (measureAlternate)
            {
                const x1 = Math.min(meterCh2X, measureX1)
                const x2 = Math.min(meterCh2X, measureX2)
                
                data.ctx.fillStyle = data.prefs.editor.measureAlternateBkgColor
                data.ctx.fillRect(x1, 0, x2 - x1, data.state.renderRect.h)
            }

            if (time1.compare(meterCh1.range.start) == 0)
                data.ctx.strokeStyle = data.prefs.editor.meterChangeColor
            else
                data.ctx.strokeStyle = data.prefs.editor.measureColor

            data.ctx.beginPath()
            data.ctx.moveTo(measureX1, 0)
            data.ctx.lineTo(measureX1, data.state.renderRect.h)
            data.ctx.stroke()

            const halfSubmeasureSize = Editor.xAtTime(data, new Rational(1, measureD * 2)) - Editor.xAtTime(data, new Rational(0))
            if (halfSubmeasureSize > 16)
            {
                let halfSubmeasureTime = time1.add(new Rational(-1, measureD * 2))
                for (let sub = 1; sub <= measureN; sub++)
                {
                    halfSubmeasureTime = halfSubmeasureTime.add(new Rational(2, measureD * 2))
                    
                    const halfSubmeasureX = 0.5 + Math.floor(Editor.xAtTime(data, halfSubmeasureTime))
                    if (halfSubmeasureX >= meterCh1X && halfSubmeasureX <= meterCh2X)
                    {
                        data.ctx.strokeStyle = data.prefs.editor.halfSubmeasureColor
                        data.ctx.beginPath()
                        data.ctx.moveTo(halfSubmeasureX, 0)
                        data.ctx.lineTo(halfSubmeasureX, data.state.renderRect.h)
                        data.ctx.stroke()
                    }
                }
            }
            
            const submeasureSize = Editor.xAtTime(data, new Rational(1, measureD)) - Editor.xAtTime(data, new Rational(0))
            if (submeasureSize > 8)
            {
                let submeasureTime = time1
                for (let sub = 1; sub <= measureN; sub++)
                {
                    submeasureTime = submeasureTime.add(new Rational(1, measureD))
                    
                    const submeasureX = 0.5 + Math.floor(Editor.xAtTime(data, submeasureTime))
                    if (submeasureX >= meterCh1X && submeasureX <= meterCh2X)
                    {
                        data.ctx.strokeStyle = data.prefs.editor.submeasureColor
                        data.ctx.beginPath()
                        data.ctx.moveTo(submeasureX, 0)
                        data.ctx.lineTo(submeasureX, data.state.renderRect.h)
                        data.ctx.stroke()
                    }
                }
            }
        }
    }
    
    /*const keyChangeTrackId = Project.keyChangeTrackForTrack(data.state.appState.project, 0)
    const keyChangeList = data.state.appState.project.timedLists.get(keyChangeTrackId)!

    for (const keyCh of keyChangeList.iterAtRange(visibleRange))
    {
        const keyChX = 0.5 + Math.floor(Editor.xAtTime(state, keyCh.time))
        
        data.ctx.strokeStyle = data.state.appState.data.prefs.editor.keyChangeColor
        data.ctx.lineCap = "square"
        data.ctx.lineWidth = 1
        
        data.ctx.beginPath()
        data.ctx.moveTo(keyChX, 0)
        data.ctx.lineTo(keyChX, data.state.contentState.h)
        data.ctx.stroke()
    }*/
}