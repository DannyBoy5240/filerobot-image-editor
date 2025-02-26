/** External Dependencies */
import React from 'react';
import PropTypes from 'prop-types';
import LockOutline from '@scaleflex/icons/lock-outline';
import UnlockOutline from '@scaleflex/icons/unlock-outline';

/** Internal Dependencies */
import { SET_RESIZE, ZOOM_CANVAS } from 'actions';
import restrictNumber from 'utils/restrictNumber';
import { useStore } from 'hooks';
import getProperDimensions from 'utils/getProperDimensions';
import getSizeAfterRotation from 'utils/getSizeAfterRotation';
import getZoomFitFactor from 'utils/getZoomFitFactor';
import { Reset } from '@scaleflex/icons';
import {
  StyledResizeWrapper,
  StyledResizeInput,
  StyledRatioLockIcon,
  StyledResetButton,
} from './Resize.styled';

const Resize = ({
  onChange,
  currentSize,
  hideResetButton,
  alignment,
  disableWrap,
}) => {
  const {
    dispatch,
    originalImage,
    resize,
    shownImageDimensions,
    adjustments: { crop, rotation = 0 },
    theme,
    t,
  } = useStore();

  const changeResize = (e) => {
    const { name, value } = e.target;

    const originalImgSizeAfterRotation = getSizeAfterRotation(
      originalImage.width,
      originalImage.height,
      rotation,
    );
    const newResize = {
      [name]: restrictNumber(value, 1),
    };
    const isHeight = name === 'height';
    const secondDimensionName = isHeight ? 'width' : 'height';
    const isRatioUnlocked = currentSize.ratioUnlocked ?? resize.ratioUnlocked;
    if (!isRatioUnlocked) {
      const originalImgRatio =
        originalImgSizeAfterRotation.width /
        originalImgSizeAfterRotation.height;
      newResize[secondDimensionName] = isHeight
        ? Math.round(newResize[name] * originalImgRatio)
        : Math.round(newResize[name] / originalImgRatio);
    }

    if (
      newResize[name] === resize[name] &&
      newResize[secondDimensionName] === resize[secondDimensionName]
    ) {
      return;
    }

    if (typeof onChange === 'function') {
      onChange(newResize);
      return;
    }

    dispatch({
      type: SET_RESIZE,
      payload: newResize,
    });
    // Fit if there was no resized width/height before for avoiding jumping on change resize
    // as we are simulating zoom relattive to original image dimensions but not applying the real original image dimensions
    if (!resize.width || !resize.height) {
      const dimensUsedInFit =
        (crop.width && crop.height && crop) || shownImageDimensions;
      dispatch({
        type: ZOOM_CANVAS,
        payload: {
          factor: getZoomFitFactor(dimensUsedInFit, newResize),
        },
      });
    }
  };

  const toggleRatioLock = () => {
    if (typeof onChange === 'function') {
      onChange({ ratioUnlocked: !currentSize.ratioUnlocked });
      return;
    }

    dispatch({
      type: SET_RESIZE,
      payload: {
        ratioUnlocked: !resize.ratioUnlocked,
      },
    });
  };

  const resetResize = () => {
    dispatch({
      type: SET_RESIZE,
      payload: {
        width: null,
        height: null,
        ratioUnlocked: false,
      },
    });
    const dimensUsedInFit =
      (crop.width && crop.height && crop) || shownImageDimensions;
    // Fitting after reset resize
    dispatch({
      type: ZOOM_CANVAS,
      payload: {
        factor: getZoomFitFactor(dimensUsedInFit, dimensUsedInFit),
      },
    });
  };

  const isOriginalSize =
    (!resize.width && !resize.height) ||
    (originalImage.width === resize.width &&
      originalImage.height === resize.height);

  const dimensions = getProperDimensions(
    ((currentSize.width || currentSize.height) && currentSize) || resize,
    crop,
    shownImageDimensions,
    originalImage,
    rotation,
  );

  const isManualChangeDisabled = resize.manualChangeDisabled;
  return (
    <StyledResizeWrapper
      className="FIE_resize-tool-options"
      alignment={alignment}
      disableWrap={disableWrap}
    >
      <StyledResizeInput
        className="FIE_resize-width-option"
        value={dimensions.width}
        name="width"
        onChange={isManualChangeDisabled ? undefined : changeResize}
        inputMode="numeric"
        title={t('resizeWidthTitle')}
        label={t('width')}
        inputProps={{ type: 'number' }}
        size="sm"
        iconEnd="px"
        placeholder="Width"
        disableWrap={disableWrap}
        disabled={isManualChangeDisabled}
      />
      <StyledRatioLockIcon
        className="FIE_resize-ratio-locker"
        title={t('toggleRatioLockTitle')}
        onClick={isManualChangeDisabled ? undefined : toggleRatioLock}
        color="basic"
        size="sm"
        disabled={isManualChangeDisabled}
      >
        {currentSize.ratioUnlocked || resize.ratioUnlocked ? (
          <UnlockOutline size={16} color={theme.palette['icons-secondary']} />
        ) : (
          <LockOutline size={16} color={theme.palette['icons-secondary']} />
        )}
      </StyledRatioLockIcon>
      <StyledResizeInput
        className="FIE_resize-height-option"
        value={dimensions.height}
        name="height"
        onChange={isManualChangeDisabled ? undefined : changeResize}
        inputMode="numeric"
        title={t('resizeHeightTitle')}
        label={t('height')}
        inputProps={{ type: 'number' }}
        size="sm"
        iconEnd="px"
        placeholder="Height"
        disableWrap={disableWrap}
        disabled={isManualChangeDisabled}
      />
      {!hideResetButton && (
        <StyledResetButton
          className="FIE_resize-reset-button"
          size="sm"
          color="basic"
          onClick={
            isOriginalSize || isManualChangeDisabled ? undefined : resetResize
          }
          disabled={isOriginalSize || isManualChangeDisabled}
        >
          <Reset />
        </StyledResetButton>
      )}
    </StyledResizeWrapper>
  );
};

Resize.defaultProps = {
  onChange: undefined,
  currentSize: {},
  hideResetButton: false,
  alignment: 'center',
  disableWrap: false,
};

Resize.propTypes = {
  disableWrap: PropTypes.bool,
  alignment: PropTypes.string,
  hideResetButton: PropTypes.bool,
  onChange: PropTypes.func,
  currentSize: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
    ratioUnlocked: false,
  }),
};

export default Resize;
