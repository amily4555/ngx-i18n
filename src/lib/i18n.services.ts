import {Injectable} from '@angular/core';
import * as mu from 'mzmu';
import {Http, Response} from '@angular/http';
import {I18nConfig} from './i18n-config';

@Injectable()
export class $$I18nServices {
    constructor(private $http: Http) {
    }

    /**
     * 资源存储器
     */
    store: any = {};

    /**
     * 当前资源
     */
    locale: any = {};
    locale_promise: Promise<any>;

    /**
     * 配置信息
     */
    config: I18nConfig;

    // setConfig(config: I18nConfig) {
    setConfig(config: any) {
        let option: I18nConfig = {
            lang: 'en',
            prefix: '/i18n',
            suffix: '.json',
            storageKey: 'I18N_LANG'
        };

        if (!config.lang) {
            config.lang = mu.storage(config.storageKey || option.storageKey) || option.lang;
        }

        this.config = mu.extend({}, option, this.config || {}, config);

        mu.storage(this.config.storageKey, this.config.lang);

        if (this.store[this.config.lang]) {
            this.locale = this.store[this.config.lang];

            this.locale_promise = new Promise((resolve)=> {
                resolve(this.store[this.config.lang]);
            });
        } else {
            let path = `${this.config.prefix}/${this.config.lang}${this.config.suffix}`;

            this.locale_promise = this.$http.get(path)
            .map((res: Response) => {
                let body = res.json();
                return body || {};
            })
            .toPromise();

            this.locale_promise.then((res: any) => {
                this.store[this.config.lang] = this.locale = res;
            });
        }
    }

    setLang(lang: string): void {
        this.setConfig({lang});
    }

    /**
     * 获得国际化结果
     * @param cb
     * @param key
     * @param params
     * @return {string}
     */
    getText(cb: any, key: string, ...params: any[]): Promise<any> {
        return this.locale_promise.then((res: any) => {
            return cb(this.translateText(res, key, params), key, params);
        });
    }

    /**
     * translate text
     * @param res
     * @param key
     * @param params
     * @return {string}
     */
    translateText(res: any, key: string, params: any[]): string {
        if(mu.isEmpty(res)){
            return key || '';
        }

        let toArray = (a: any) => {
            return !mu.isArray(a) ? [a] : a;
        };

        let concat = (a: any, b: any) => {
            return toArray(a).concat(toArray(b));
        };

        let _params = [];

        mu.each(params, (o) => {
            _params = concat(_params, o);
        });

        let text = mu.prop(res, key) || res[key] || key || '';

        /**
         * 先匹配对象属性
         * 默认对象属性为参数中的最后一个
         */
        mu.run(_params[_params.length - 1], (obj) => {
            if(mu.isObject(obj)){
                obj = _params.pop();
                text = text.replace(/\{(.*?)\}/g, function(m, i) {
                    return mu.prop(obj, i) || m;
                });
            }
        });

        text = mu.format(text, ..._params);

        return text;
    }

}
