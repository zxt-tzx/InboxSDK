import * as Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import delayAsap from '../../lib/delay-asap';
import type { Driver } from '../../driver-interfaces/driver';
import querySelector from '../../lib/dom/querySelectorOrFail';
import { sidebarWaitingPlatformSelector } from './constants';

class ContentPanelViewDriver {
  _driver: Driver;
  _stopper: Kefir.Observable<null, unknown>;
  _eventStream = kefirBus<{ eventName: string }, unknown>();
  _isActive: boolean = false;
  // This is not the `id` property passed by the application, but a random
  // unique identifier used to manage a specific instance.
  _instanceId: string = `${Date.now()}-${Math.random()}`;
  _sidebarId: string;
  _isGlobal: boolean;

  constructor(
    driver: Driver,
    descriptor: Kefir.Observable<Record<string, any>, unknown>,
    sidebarId: string,
    isGlobal?: boolean
  ) {
    this._driver = driver;
    this._sidebarId = sidebarId;
    this._isGlobal = Boolean(isGlobal);
    this._stopper = this._eventStream
      .ignoreValues()
      .beforeEnd(() => null)
      .toProperty();
    const document = global.document; //fix for unit test

    this._eventStream.plug(
      Kefir.fromEvents(document.body, 'inboxsdkSidebarPanelActivated')
        .filter((e: any) => e.detail.instanceId === this._instanceId)
        .map(() => {
          this._isActive = true;
          return {
            eventName: 'activate',
          };
        })
    );

    this._eventStream.plug(
      Kefir.fromEvents(document.body, 'inboxsdkSidebarPanelDeactivated')
        .filter((e: any) => e.detail.instanceId === this._instanceId)
        .map(() => {
          this._isActive = false;
          return {
            eventName: 'deactivate',
          };
        })
    );

    // Attach a value-listener so that it immediately subscribes and the
    // property retains its value.
    const afterAsap = delayAsap()
      .toProperty()

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .onValue(() => {});
    let hasPlacedAlready = false;
    let appName: any;
    const waitingPlatform = querySelector(
      document.body,
      sidebarWaitingPlatformSelector
    );
    descriptor
      .flatMap((x) => afterAsap.map(() => x))
      .takeUntilBy(this._stopper)
      .onValue((descriptor) => {
        const {
          el,
          iconUrl,
          iconClass,
          title,
          orderHint,
          id,
          hideTitleBar,
          appIconUrl,
          primaryColor,
          secondaryColor,
        } = descriptor;
        appName =
          descriptor.appName || driver.getOpts().appName || descriptor.title;

        if (!document.body.contains(el)) {
          waitingPlatform.appendChild(el);
        }

        const eventName = hasPlacedAlready
          ? 'inboxsdkUpdateSidebarPanel'
          : 'inboxsdkNewSidebarPanel';
        hasPlacedAlready = true;
        el.dispatchEvent(
          new CustomEvent(eventName, {
            bubbles: true,
            cancelable: false,
            detail: {
              appIconUrl:
                appIconUrl || this._driver.getOpts().appIconUrl || iconUrl,
              appId: this._driver.getAppId(),
              appName,
              hideTitleBar: Boolean(hideTitleBar),
              iconClass,
              iconUrl,
              id: String(id || title),
              instanceId: this._instanceId,
              isGlobal,
              orderHint: typeof orderHint === 'number' ? orderHint : 0,
              primaryColor: primaryColor || this._driver.getOpts().primaryColor,
              secondaryColor:
                secondaryColor || this._driver.getOpts().secondaryColor,
              sidebarId: this._sidebarId,
              title,
            },
          })
        );
      });

    this._stopper.onValue(() => {
      if (!hasPlacedAlready) return;
      document.body.dispatchEvent(
        new CustomEvent('inboxsdkRemoveSidebarPanel', {
          bubbles: true,
          cancelable: false,
          detail: {
            appName,
            sidebarId: this._sidebarId,
            instanceId: this._instanceId,
          },
        })
      );
    });
  }

  getStopper() {
    return this._stopper;
  }

  getEventStream() {
    return this._eventStream;
  }

  scrollIntoView() {
    document.body.dispatchEvent(
      new CustomEvent('inboxsdkSidebarPanelScrollIntoView', {
        bubbles: true,
        cancelable: false,
        detail: {
          instanceId: this._instanceId,
          sidebarId: this._sidebarId,
        },
      })
    );
  }

  close() {
    document.body.dispatchEvent(
      new CustomEvent('inboxsdkSidebarPanelClose', {
        bubbles: true,
        cancelable: false,
        detail: {
          instanceId: this._instanceId,
          isGlobal: this._isGlobal,
          sidebarId: this._sidebarId,
        },
      })
    );
  }

  open() {
    document.body.dispatchEvent(
      new CustomEvent('inboxsdkSidebarPanelOpen', {
        bubbles: true,
        cancelable: false,
        detail: {
          instanceId: this._instanceId,
          isGlobal: this._isGlobal,
          sidebarId: this._sidebarId,
        },
      })
    );
  }

  isActive(): boolean {
    return this._isActive;
  }

  remove() {
    this._eventStream.end();
  }
}

export default ContentPanelViewDriver;