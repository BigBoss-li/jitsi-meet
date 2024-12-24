import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { IconFourCol, IconOneCol, IconOneLargeCol, IconTwoCol } from '../../../../base/icons/svg';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';

/**
 * The type of the React {@code Component} props of {@link SignalSettingsContent}.
 */
export interface IProps {

    /**
     * Callback invoked to change current camera.
     */
    setSignalLayout: Function;

    /**
     * Callback invoked to toggle the settings popup visibility.
     */
    toggleSignalSettings: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            maxHeight: 'calc(100dvh - 100px)',
            overflow: 'auto',
            margin: 0,
            marginBottom: theme.spacing(1),
            position: 'relative',
            right: 'auto'
        },

        signalWrap: {
            padding: '20px 20px',
            display: 'flex',
            gap: '20px'
        },

        icon: {
            width: '24px',
            height: '24px',
            cursor: 'pointer'
        },

        labelContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: '100%',
            zIndex: 2,
            padding: theme.spacing(2)
        },

        label: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.labelBold),
            width: 'fit-content',
            maxwidth: `calc(100% - ${theme.spacing(2)} - ${theme.spacing(2)})`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },

        checkboxContainer: {
            padding: '10px 14px'
        }
    };
});

const SignalSettingsContent = ({
    setSignalLayout,
    toggleSignalSettings
}: IProps) => {

    // const { t } = useTranslation();

    const { classes } = useStyles();

    const _onEntryClick = (layoutType: string) => () => {
        setSignalLayout(layoutType);
        toggleSignalSettings();
    };


    const layoutProps: any = {
        className: classes.signalWrap
    };
    const layoutList = [
        {
            key: 'ONE',
            icon: <IconOneCol />
        },
        {
            key: 'TWO',
            icon: <IconTwoCol />
        },
        {
            key: 'FOUR',
            icon: <IconFourCol />
        },
        {
            key: 'ONE_LARGE',
            icon: <IconOneLargeCol />
        }
    ];
    const _rednerLayoutIcon = (data: { icon: any; key: string; }) => {
        const { icon, key } = data;

        const layoutItemProps: any = {
            className: classes.icon,
            key,
            onClick: _onEntryClick(key)
        };

        return (<div { ...layoutItemProps }>
            { icon }
        </div>);
    };

    return (
        <ContextMenu
            activateFocusTrap = { true }
            aria-labelledby = 'video-settings-button'
            className = { classes.container }
            hidden = { false }
            id = 'video-settings-dialog'
            role = 'radiogroup'
            tabIndex = { -1 }>
            <ContextMenuItemGroup>
                <div
                    { ...layoutProps }
                    onClick = { toggleSignalSettings }>
                    { layoutList.map(data => _rednerLayoutIcon(data)) }
                </div>
            </ContextMenuItemGroup>
        </ContextMenu>
    );
};

export default SignalSettingsContent;
