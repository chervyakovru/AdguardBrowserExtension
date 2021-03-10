import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { SettingsSection } from '../Settings/SettingsSection';
import { SettingsSet } from '../Settings/SettingsSet';
import { Setting, SETTINGS_TYPES } from '../Settings/Setting';
import { Editor } from '../Editor';
import { rootStore } from '../../stores/RootStore';
import { uploadFile } from '../../../helpers';
import { log } from '../../../../common/log';
import { STATES as SAVING_STATES } from '../Editor/savingFSM';
import { reactTranslator } from '../../../../common/translators/reactTranslator';

const Allowlist = observer(() => {
    const { settingsStore, uiStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.getAllowlist();
        })();
    }, []);

    const editorRef = useRef(null);
    const inputRef = useRef(null);

    const { settings, savingAllowlistState } = settingsStore;

    const { DEFAULT_ALLOWLIST_MODE } = settings.names;

    const settingChangeHandler = async ({ id, data }) => {
        await settingsStore.updateSetting(id, data);
        await settingsStore.getAllowlist();
    };

    const importClickHandler = (e) => {
        e.preventDefault();
        inputRef.current.click();
    };

    const exportClickHandler = async () => {
        window.open('/pages/export.html#wl', '_blank');
    };

    const inputChangeHandler = async (event) => {
        event.persist();
        const file = event.target.files[0];

        try {
            const content = await uploadFile(file, 'txt');
            await settingsStore.saveAllowlist(content);
        } catch (e) {
            log.debug(e.message);
            uiStore.addNotification({ description: e.message });
        }

        // eslint-disable-next-line no-param-reassign
        event.target.value = '';
    };

    const renderSavingState = (savingState) => {
        const indicatorTextMap = {
            [SAVING_STATES.IDLE]: '',
            [SAVING_STATES.SAVED]: reactTranslator.getMessage('options_editor_indicator_saved'),
            [SAVING_STATES.SAVING]: reactTranslator.getMessage('options_editor_indicator_saving'),
        };

        const indicatorText = indicatorTextMap[savingState];

        if (savingState === SAVING_STATES.IDLE) {
            return null;
        }

        const indicatorClassnames = classnames('editor__label', {
            'editor__label--saved': savingState === SAVING_STATES.SAVED,
        });

        return (
            <div className={indicatorClassnames}>
                {indicatorText}
            </div>
        );
    };

    const saveClickHandler = async () => {
        const value = editorRef.current.editor.getValue();
        await settingsStore.saveAllowlist(value);
    };

    const shortcuts = [{
        name: 'save',
        bindKey: { win: 'Ctrl-S', mac: 'Command-S' },
        exec: async () => {
            await saveClickHandler();
        },
    }];

    return (
        <>
            <SettingsSection
                title={reactTranslator.getMessage('options_allowlist')}
                description={reactTranslator.getMessage('options_allowlist_desc')}
            >
                <SettingsSet
                    title={reactTranslator.getMessage('options_allowlist_invert')}
                    description={reactTranslator.getMessage('options_allowlist_invert_desc')}
                    inlineControl={(
                        <Setting
                            id={DEFAULT_ALLOWLIST_MODE}
                            label={reactTranslator.getMessage('options_allowlist_invert')}
                            type={SETTINGS_TYPES.CHECKBOX}
                            value={settings.values[DEFAULT_ALLOWLIST_MODE]}
                            handler={settingChangeHandler}
                            inverted
                        />
                    )}
                />
            </SettingsSection>
            <Editor
                name="allowlist"
                value={settingsStore.allowlist}
                editorRef={editorRef}
                shortcuts={shortcuts}
            />
            <div className="actions actions--divided">
                <div className="actions__group">
                    <input
                        type="file"
                        id="inputEl"
                        accept="text/plain"
                        ref={inputRef}
                        onChange={inputChangeHandler}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="button button--m button--green actions__btn"
                        onClick={importClickHandler}
                    >
                        {reactTranslator.getMessage('options_userfilter_import')}
                    </button>
                    <button
                        type="button"
                        className="button button--m button--green-bd actions__btn"
                        onClick={exportClickHandler}
                        disabled={!settingsStore.allowlist}
                    >
                        {reactTranslator.getMessage('options_userfilter_export')}
                    </button>
                </div>
                <div className="actions__group">
                    {renderSavingState(savingAllowlistState)}
                    <button
                        type="button"
                        className="button button--m button--green actions__btn"
                        onClick={saveClickHandler}
                    >
                        {reactTranslator.getMessage('options_editor_save')}
                    </button>
                </div>
            </div>
        </>
    );
});

export { Allowlist };
