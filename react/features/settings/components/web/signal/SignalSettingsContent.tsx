import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { IconFourCol, IconOneCol, IconOneLargeCol, IconTwoCol } from '../../../../base/icons/svg';
import ContextMenu from '../../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../../base/ui/components/web/ContextMenuItemGroup';

/**
 * The type of the React {@code Component} props of {@link SignalSettingsContent}.
 */
export interface IProps {

    /**
     * Callback invoked to change current camera.
     */
    setSignalLayout?: Function;

    /**
     * Signal layout.
     */
    signalLayout?: string;

    /**
     * Callback invoked to toggle the settings popup visibility.
     */
    toggleSignalSettings?: Function;
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
            padding: '10px 10px',
            display: 'flex',
            flexDirection: 'column'
        },

        signalItem: {
            padding: '10px 20px',
            height: '24px',
            lineHeight: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            columnGap: '10px'
        },

        signalItemActive: {
            backgroundColor: '#1f2928',
            borderRadius: '6px'
        },

        signalIcon: {
            width: '20px',
            height: '20px'
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

        },

        checkboxContainer: {
            padding: '10px 14px'
        }
    };
});

const SignalSettingsContent = ({
    signalLayout,
    setSignalLayout,
    toggleSignalSettings
}: IProps) => {
    console.log(signalLayout);

    // const { t } = useTranslation();

    const { classes, cx } = useStyles();

    const _onEntryClick = (layoutType: string) => () => {
        setSignalLayout?.(layoutType);
        toggleSignalSettings?.();
    };


    const layoutProps: any = {
        className: classes.signalWrap
    };
    const layoutList = [
        {
            key: 'ONE',
            icon: <IconOneCol />,
            label: '单分屏'
        },
        {
            key: 'TWO',
            icon: <IconTwoCol />,
            label: '二分屏'
        },
        {
            key: 'FOUR',
            icon: <IconFourCol />,
            label: '四分屏'
        },
        {
            key: 'ONE_LARGE',
            icon: <IconOneLargeCol />,
            label: '一拖三屏'
        }
    ];

    const _rednerLayoutIcon = (data: { icon: any; key: string; label: string; }) => {
        const { icon, key, label } = data;

        const _getLayoutItemClassName = () => {
            if (signalLayout && signalLayout === key) {
                return cx(classes.signalItem, classes.signalItemActive);
            }

            return classes.signalItem;
        };

        const layoutItemProps: any = {
            className: _getLayoutItemClassName(),
            key,
            onClick: _onEntryClick(key)
        };

        return (<div { ...layoutItemProps }>
            <div className = { classes.signalIcon }>{ icon }</div>
            <div className = { classes.label }>{ label }</div>
        </div>);
    };

    return (
        <ContextMenu
            activateFocusTrap = { true }
            aria-labelledby = 'signal-settings-button'
            className = { classes.container }
            hidden = { false }
            id = 'signal-settings-dialog'
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

const mapStateToProps = (state: IReduxState) => {
    const { signalLayout } = state['features/settings'];

    return {
        signalLayout
    };
};


export default connect(mapStateToProps)(SignalSettingsContent);
