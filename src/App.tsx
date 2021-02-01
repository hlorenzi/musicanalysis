import React from "react"
import * as Dockable from "./dockable"
import * as Project from "./project"
import * as Playback from "./playback"
import * as Prefs from "./prefs"
import * as Popup from "./popup"
import * as Menubar from "./menubar"
import * as UI from "./ui"
import { useRefState } from "./util/refState"
import PlaybackToolbar from "./PlaybackToolbar"
import MenuFile from "./MenuFile"
import MenuWindow from "./MenuWindow"
import "./types"


export default function App()
{
    const dockableCtx = Dockable.useDockableInit()
    const projectCtx = Project.useProjectInit()
    const playbackCtx = Playback.usePlaybackInit(projectCtx)
    const prefsCtx = useRefState(() => Prefs.getDefault())
    const popupCtx = useRefState(() => Popup.getDefaultCtx())


    React.useEffect(() =>
    {
        window.addEventListener("keydown", (ev: KeyboardEvent) =>
        {
            if (document.activeElement && document.activeElement.tagName == "INPUT")
                return

            const key = ev.key.toLowerCase()

            if (key == " ")
            {
                playbackCtx.ref.current.togglePlaying()
            }
            else if ((key == "y" && ev.ctrlKey) || (key == "z" && ev.ctrlKey && ev.shiftKey))
            {
                projectCtx.ref.current.redo()
            }
            else if (key == "z" && ev.ctrlKey)
            {
                projectCtx.ref.current.undo()
            }
            else
            {
                return
            }

            ev.preventDefault()
            ev.stopPropagation()
        })

    }, [])


    return <>
        <Dockable.DockableContext.Provider value={ dockableCtx }>
        <Project.ProjectContext.Provider value={ projectCtx }>
        <Playback.PlaybackContext.Provider value={ playbackCtx }>
        <Prefs.PrefsContext.Provider value={ prefsCtx }>
        <Popup.PopupContext.Provider value={ popupCtx }>
            <div style={{
                display: "grid",
                gridTemplate: "auto 1fr / 1fr",
                width: "100vw",
                height: "100vh",
            }}>

                <Menubar.Root>
                    <MenuFile/>
                    <MenuWindow/>
                    <PlaybackToolbar/>
                    <a
                        href="https://github.com/hlorenzi/theorytracker#how-to-use"
                        style={{
                            color: "#fff",
                            alignSelf: "center",
                            marginLeft: "1em",
                            fontSize: "1.25em",
                    }}>
                        How to use the app
                    </a>
                </Menubar.Root>

                { !playbackCtx.ref.current.synthLoading ? null :
                    <UI.LoadingBar floating/>
                }

                <Dockable.Container/>

            </div>

            { !popupCtx.ref.current.elem ? null :
                <popupCtx.ref.current.elem/>
            }
        </Popup.PopupContext.Provider>
        </Prefs.PrefsContext.Provider>
        </Playback.PlaybackContext.Provider>
        </Project.ProjectContext.Provider>
        </Dockable.DockableContext.Provider>
    </>
}