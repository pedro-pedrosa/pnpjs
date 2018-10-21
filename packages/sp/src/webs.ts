import { extend, TypedHash, jsS } from "@pnp/common";
import { QueryableInterface, QueryableProp, QueryableCompositeProp, QueryableODataProp } from "@pnp/odata";
import { SharePointQueryableCollection, defaultPath } from "./sharepointqueryable";
import { SharePointQueryableShareableWeb } from "./sharepointqueryableshareable";
import { Folders, Folder } from "./folders";
import { Lists, List } from "./lists";
import { Fields } from "./fields";
import { Site } from "./site";
import { Navigation } from "./navigation";
import { SiteGroups, SiteGroup } from "./sitegroups";
import { ContentTypes } from "./contenttypes";
import { RoleDefinitions } from "./roles";
import { File } from "./files";
import { extractWebUrl } from "./utils/extractweburl";
import { ChangeQuery, StorageEntity, PrincipalType } from "./types";
import { SiteUsers, SiteUser, CurrentUser, SiteUserProps } from "./siteusers";
import { UserCustomActions } from "./usercustomactions";
import { odataUrlFrom } from "./odata";
import { SPBatch } from "./batch";
import { Features } from "./features";
import { RelatedItemManger, RelatedItemManagerImpl } from "./relateditems";
import { AppCatalog } from "./appcatalog";
import { RegionalSettings } from "./regionalsettings";
import { ClientSidePage, ClientSidePageComponent } from "./clientsidepages";

/**
 * Describes a collection of webs
 *
 */
@defaultPath("webs")
export class Webs<QueryableType = any[]> extends SharePointQueryableCollection<QueryableType> {

    /**
     * Adds a new web to the collection
     *
     * @param title The new web's title
     * @param url The new web's relative url
     * @param description The new web's description
     * @param template The new web's template internal name (default = STS)
     * @param language The locale id that specifies the new web's language (default = 1033 [English, US])
     * @param inheritPermissions When true, permissions will be inherited from the new web's parent (default = true)
     */
    public add(
        title: string,
        url: string,
        description = "",
        template = "STS",
        language = 1033,
        inheritPermissions = true): Promise<WebAddResult> {

        const props = {
            Description: description,
            Language: language,
            Title: title,
            Url: url,
            UseSamePermissionsAsParentSite: inheritPermissions,
            WebTemplate: template,
        };

        const postBody = jsS({
            "parameters":
                extend({
                    "__metadata": { "type": "SP.WebCreationInformation" },
                }, props),
        });

        return this.clone(Webs, "add").postCore({ body: postBody }).then((data) => {
            return {
                data: data,
                web: new Web(odataUrlFrom(data).replace(/_api\/web\/?/i, "")),
            };
        });
    }
}

/**
 * Describes a collection of web infos
 *
 */
@defaultPath("webinfos")
export class WebInfos extends SharePointQueryableCollection {}

/**
 * Describes a web
 *
 */
@defaultPath("_api/web")
export class Web<QueryableType = any> extends SharePointQueryableShareableWeb<QueryableType> {

    /**
     * Creates a new web instance from the given url by indexing the location of the /_api/
     * segment. If this is not found the method creates a new web with the entire string as
     * supplied.
     *
     * @param url
     */
    public static fromUrl(url: string, path?: string) {
        return new Web(extractWebUrl(url), path);
    }

    /**
     * Provides a strongly typed version of the query methods (select, expand, get)
     *
     */
    public stronglyTyped(): Web<WebQueryableInterface> {
        return this;
    }

    /**
     * Gets this web's subwebs
     *
     */
    public get webs(): Webs {
        return new Webs(this);
    }

    /**
     * Gets this web's parent web and data
     *
     */
    public getParentWeb(): Promise<{ data: any; web: Web }> {
        return this.stronglyTyped().expand("ParentWeb").select("ParentWeb/Id").get()
            .then(({ ParentWeb }) => new Site(this.toUrlAndQuery().split("/_api")[0]).openWebById(ParentWeb.Id));
    }

    /**
    * Returns a collection of objects that contain metadata about subsites of the current site in which the current user is a member.
    *
    * @param nWebTemplateFilter Specifies the site definition (default = -1)
    * @param nConfigurationFilter A 16-bit integer that specifies the identifier of a configuration (default = -1)
    */
    public getSubwebsFilteredForCurrentUser(nWebTemplateFilter = -1, nConfigurationFilter = -1): Webs {
        return this.clone(Webs, `getSubwebsFilteredForCurrentUser(nWebTemplateFilter=${nWebTemplateFilter},nConfigurationFilter=${nConfigurationFilter})`);
    }

    /**
     * Allows access to the web's all properties collection
     */
    public get allProperties(): SharePointQueryableCollection {
        return this.clone(SharePointQueryableCollection, "allproperties");
    }

    /**
     * Gets a collection of WebInfos for this web's subwebs
     *
     */
    public get webinfos(): WebInfos {
        return new WebInfos(this);
    }

    /**
     * Gets the content types available in this web
     *
     */
    public get contentTypes(): ContentTypes {
        return new ContentTypes(this);
    }

    /**
     * Gets the lists in this web
     *
     */
    public get lists(): Lists {
        return new Lists(this);
    }

    /**
     * Gets the fields in this web
     *
     */
    public get fields(): Fields {
        return new Fields(this);
    }

    /**
     * Gets the active features for this web
     *
     */
    public get features(): Features {
        return new Features(this);
    }

    /**
     * Gets the available fields in this web
     *
     */
    public get availablefields(): Fields {
        return new Fields(this, "availablefields");
    }

    /**
     * Gets the navigation options in this web
     *
     */
    public get navigation(): Navigation {
        return new Navigation(this);
    }

    /**
     * Gets the site users
     *
     */
    public get siteUsers(): SiteUsers {
        return new SiteUsers(this);
    }

    /**
     * Gets the site groups
     *
     */
    public get siteGroups(): SiteGroups {
        return new SiteGroups(this);
    }

    /**
     * Gets site user info list
     *
     */
    public get siteUserInfoList(): List {
        return new List(this, "siteuserinfolist");
    }

    /**
     * Gets regional settings
     *
     */
    public get regionalSettings(): RegionalSettings {
        return new RegionalSettings(this);
    }

    /**
     * Gets the current user
     */
    public get currentUser(): CurrentUser {
        return new CurrentUser(this);
    }

    /**
     * Gets the top-level folders in this web
     *
     */
    public get folders(): Folders {
        return new Folders(this);
    }

    /**
     * Gets all user custom actions for this web
     *
     */
    public get userCustomActions(): UserCustomActions {
        return new UserCustomActions(this);
    }

    /**
     * Gets the collection of RoleDefinition resources
     *
     */
    public get roleDefinitions(): RoleDefinitions {
        return new RoleDefinitions(this);
    }

    /**
     * Provides an interface to manage related items
     *
     */
    public get relatedItems(): RelatedItemManger {
        return RelatedItemManagerImpl.FromUrl(this.toUrl());
    }

    /**
     * Creates a new batch for requests within the context of this web
     *
     */
    public createBatch(): SPBatch {
        return new SPBatch(this.parentUrl);
    }

    /**
     * Gets the root folder of this web
     *
     */
    public get rootFolder(): Folder {
        return new Folder(this, "rootFolder");
    }

    /**
     * Gets the associated owner group for this web
     *
     */
    public get associatedOwnerGroup(): SiteGroup {
        return new SiteGroup(this, "associatedownergroup");
    }

    /**
     * Gets the associated member group for this web
     *
     */
    public get associatedMemberGroup(): SiteGroup {
        return new SiteGroup(this, "associatedmembergroup");
    }

    /**
     * Gets the associated visitor group for this web
     *
     */
    public get associatedVisitorGroup(): SiteGroup {
        return new SiteGroup(this, "associatedvisitorgroup");
    }

    /**
     * Gets the default document library for this web
     *
     */
    public get defaultDocumentLibrary(): List {
        return new List(this, "DefaultDocumentLibrary");
    }

    /**
     * Gets a folder by server relative url
     *
     * @param folderRelativeUrl The server relative path to the folder (including /sites/ if applicable)
     */
    public getFolderByServerRelativeUrl(folderRelativeUrl: string): Folder {
        return new Folder(this, `getFolderByServerRelativeUrl('${folderRelativeUrl}')`);
    }

    /**
     * Gets a folder by server relative relative path if your folder name contains # and % characters
     * you need to first encode the file name using encodeURIComponent() and then pass the url
     * let url = "/sites/test/Shared Documents/" + encodeURIComponent("%123");
     * This works only in SharePoint online.
     *
     * @param folderRelativeUrl The server relative path to the folder (including /sites/ if applicable)
     */
    public getFolderByServerRelativePath(folderRelativeUrl: string): Folder {
        return new Folder(this, `getFolderByServerRelativePath(decodedUrl='${folderRelativeUrl}')`);
    }

    /**
     * Gets a file by server relative url
     *
     * @param fileRelativeUrl The server relative path to the file (including /sites/ if applicable)
     */
    public getFileByServerRelativeUrl(fileRelativeUrl: string): File {
        return new File(this, `getFileByServerRelativeUrl('${fileRelativeUrl}')`);
    }

    /**
     * Gets a file by server relative url if your file name contains # and % characters
     * you need to first encode the file name using encodeURIComponent() and then pass the url
     * let url = "/sites/test/Shared Documents/" + encodeURIComponent("%123.docx");
     *
     * @param fileRelativeUrl The server relative path to the file (including /sites/ if applicable)
     */
    public getFileByServerRelativePath(fileRelativeUrl: string): File {
        return new File(this, `getFileByServerRelativePath(decodedUrl='${fileRelativeUrl}')`);
    }

    /**
     * Gets a list by server relative url (list's root folder)
     *
     * @param listRelativeUrl The server relative path to the list's root folder (including /sites/ if applicable)
     */
    public getList(listRelativeUrl: string): List {
        return new List(this, `getList('${listRelativeUrl}')`);
    }

    /**
     * Updates this web instance with the supplied properties
     *
     * @param properties A plain object hash of values to update for the web
     */
    public update(properties: TypedHash<string | number | boolean>): Promise<WebUpdateResult> {

        const postBody = jsS(extend({
            "__metadata": { "type": "SP.Web" },
        }, properties));

        return this.postCore({
            body: postBody,
            headers: {
                "X-HTTP-Method": "MERGE",
            },
        }).then((data) => {
            return {
                data: data,
                web: this,
            };
        });
    }

    /**
     * Deletes this web
     *
     */
    public delete(): Promise<void> {
        return super.deleteCore();
    }

    /**
     * Applies the theme specified by the contents of each of the files specified in the arguments to the site
     *
     * @param colorPaletteUrl The server-relative URL of the color palette file
     * @param fontSchemeUrl The server-relative URL of the font scheme
     * @param backgroundImageUrl The server-relative URL of the background image
     * @param shareGenerated When true, the generated theme files are stored in the root site. When false, they are stored in this web
     */
    public applyTheme(colorPaletteUrl: string, fontSchemeUrl: string, backgroundImageUrl: string, shareGenerated: boolean): Promise<void> {

        const postBody = jsS({
            backgroundImageUrl: backgroundImageUrl,
            colorPaletteUrl: colorPaletteUrl,
            fontSchemeUrl: fontSchemeUrl,
            shareGenerated: shareGenerated,
        });

        return this.clone(Web, "applytheme").postCore({ body: postBody });
    }

    /**
     * Applies the specified site definition or site template to the Web site that has no template applied to it
     *
     * @param template Name of the site definition or the name of the site template
     */
    public applyWebTemplate(template: string): Promise<void> {

        const q = this.clone(Web, "applywebtemplate");
        q.concat(`(@t)`);
        q.query.set("@t", template);
        return q.postCore();
    }

    /**
     * Checks whether the specified login name belongs to a valid user in the web. If the user doesn't exist, adds the user to the web.
     *
     * @param loginName The login name of the user (ex: i:0#.f|membership|user@domain.onmicrosoft.com)
     */
    public ensureUser(loginName: string): Promise<WebEnsureUserResult> {
        const postBody = jsS({
            logonName: loginName,
        });

        return this.clone(Web, "ensureuser").postCore({ body: postBody }).then((data: any) => {
            return {
                data: data,
                user: new SiteUser(odataUrlFrom(data)),
            };
        });
    }

    /**
     * Returns a collection of site templates available for the site
     *
     * @param language The locale id of the site templates to retrieve (default = 1033 [English, US])
     * @param includeCrossLanguage When true, includes language-neutral site templates; otherwise false (default = true)
     */
    public availableWebTemplates(language = 1033, includeCrossLanugage = true): SharePointQueryableCollection {
        return new SharePointQueryableCollection(this, `getavailablewebtemplates(lcid=${language}, doincludecrosslanguage=${includeCrossLanugage})`);
    }

    /**
     * Returns the list gallery on the site
     *
     * @param type The gallery type - WebTemplateCatalog = 111, WebPartCatalog = 113 ListTemplateCatalog = 114,
     * MasterPageCatalog = 116, SolutionCatalog = 121, ThemeCatalog = 123, DesignCatalog = 124, AppDataCatalog = 125
     */
    public getCatalog(type: number): Promise<List> {
        return this.clone(Web, `getcatalog(${type})`).select("Id").get().then((data) => {
            return new List(odataUrlFrom(data));
        });
    }

    /**
     * Returns the collection of changes from the change log that have occurred within the list, based on the specified query
     *
     * @param query The change query
     */
    public getChanges(query: ChangeQuery): Promise<any> {

        const postBody = jsS({ "query": extend({ "__metadata": { "type": "SP.ChangeQuery" } }, query) });
        return this.clone(Web, "getchanges").postCore({ body: postBody });
    }

    /**
     * Gets the custom list templates for the site
     *
     */
    public get customListTemplate(): SharePointQueryableCollection {
        return new SharePointQueryableCollection(this, "getcustomlisttemplates");
    }

    /**
     * Returns the user corresponding to the specified member identifier for the current site
     *
     * @param id The id of the user
     */
    public getUserById(id: number): SiteUser {
        return new SiteUser(this, `getUserById(${id})`);
    }

    /**
     * Returns the name of the image file for the icon that is used to represent the specified file
     *
     * @param filename The file name. If this parameter is empty, the server returns an empty string
     * @param size The size of the icon: 16x16 pixels = 0, 32x32 pixels = 1 (default = 0)
     * @param progId The ProgID of the application that was used to create the file, in the form OLEServerName.ObjectName
     */
    public mapToIcon(filename: string, size = 0, progId = ""): Promise<string> {
        return this.clone(Web, `maptoicon(filename='${filename}', progid='${progId}', size=${size})`).get();
    }

    /**
     * Returns the tenant property corresponding to the specified key in the app catalog site
     *
     * @param key Id of storage entity to be set
     */
    public getStorageEntity(key: string): Promise<StorageEntity> {
        return this.clone(Web, `getStorageEntity('${key}')`).get();
    }

    /**
     * This will set the storage entity identified by the given key (MUST be called in the context of the app catalog)
     *
     * @param key Id of storage entity to be set
     * @param value Value of storage entity to be set
     * @param description Description of storage entity to be set
     * @param comments Comments of storage entity to be set
     */
    public setStorageEntity(key: string, value: string, description = "", comments = ""): Promise<void> {
        return this.clone(Web, `setStorageEntity`).postCore({
            body: jsS({
                comments,
                description,
                key,
                value,
            }),
        });
    }

    /**
     * This will remove the storage entity identified by the given key
     *
     * @param key Id of storage entity to be removed
     */
    public removeStorageEntity(key: string): Promise<void> {
        return this.clone(Web, `removeStorageEntity('${key}')`).postCore();
    }

    /**
     * Gets the app catalog for this web
     *
     * @param url Optional url or web containing the app catalog (default: current web)
     */
    public getAppCatalog(url?: string | Web) {
        return new AppCatalog(url || this);
    }

    /**
     * Gets the collection of available client side web parts for this web instance
     */
    public getClientSideWebParts(): Promise<ClientSidePageComponent[]> {
        return this.clone(SharePointQueryableCollection, "GetClientSideWebParts").get();
    }

    /**
     * Creates a new client side page
     *
     * @param pageName Name of the new page
     * @param title Display title of the new page
     * @param libraryTitle Title of the library in which to create the new page. Default: "Site Pages"
     */
    public addClientSidePage(pageName: string, title = pageName.replace(/\.[^/.]+$/, ""), libraryTitle = "Site Pages"): Promise<ClientSidePage> {
        return ClientSidePage.create(this.lists.getByTitle(libraryTitle), pageName, title);
    }

    /**
     * Creates a new client side page using the library path
     *
     * @param pageName Name of the new page
     * @param listRelativePath The server relative path to the list's root folder (including /sites/ if applicable)
     * @param title Display title of the new page
     */
    public addClientSidePageByPath(pageName: string, listRelativePath: string, title = pageName.replace(/\.[^/.]+$/, "")): Promise<ClientSidePage> {
        return ClientSidePage.create(this.getList(listRelativePath), pageName, title);
    }

    /**
     * Creates the default associated groups (Members, Owners, Visitors) and gives them the default permissions on the site
     *
     */
    public createDefaultAssociatedGroups(): Promise<void> {
        return this.clone(Web, `createDefaultAssociatedGroups`).postCore();
    }
}

/**
 * Result from adding a web
 *
 */
export interface WebAddResult {
    data: any;
    web: Web;
}

/**
 * Result from updating a web
 *
 */
export interface WebUpdateResult {
    data: any;
    web: Web;
}

/**
 * Result from retrieving a catalog
 *
 */
export interface GetCatalogResult {
    data: any;
    list: List;
}

/**
 * Result from ensuring a user
 *
 */
export interface WebEnsureUserResult {
    data: SiteUserProps;
    user: SiteUser;
}

export type WebDefaultSelectedKeys =
    "AllowRssFeeds" |
    "AlternateCssUrl" |
    "AppInstanceId" |
    "Configuration" |
    "Created" |
    "CurrentChangeToken" |
    "CurrentUser/Email" |
    "CurrentUser/Id" |
    "CurrentUser/IsEmailAuthenticationGuestUser" |
    "CurrentUser/IsHiddenInUI" |
    "CurrentUser/IsShareByEmailGuestUser" |
    "CurrentUser/IsSiteAdmin" |
    "CurrentUser/LoginName" |
    "CurrentUser/PrincipalType" |
    "CurrentUser/Title" |
    "CurrentUser/UserId" |
    "CurrentUser/odata.editLink" |
    "CurrentUser/odata.id" |
    "CurrentUser/odata.type" |
    "CustomMasterUrl" |
    "Description" |
    "DesignPackageId" |
    "DocumentLibraryCalloutOfficeWebAppPreviewersDisabled" |
    "EnableMinimalDownload" |
    "FooterEnabled" |
    "HeaderEmphasis" |
    "HeaderLayout" |
    "HorizontalQuickLaunch" |
    "Id" |
    "IsMultilingual" |
    "Language" |
    "LastItemModifiedDate" |
    "LastItemUserModifiedDate" |
    "MasterUrl" |
    "MegaMenuEnabled" |
    "NoCrawl" |
    "ObjectCacheEnabled" |
    "OverwriteTranslationsOnChange" |
    "QuickLaunchEnabled" |
    "ParentWeb/Configuration" |
    "ParentWeb/Created" |
    "ParentWeb/Description" |
    "ParentWeb/Id" |
    "ParentWeb/Language" |
    "ParentWeb/LastItemModifiedDate" |
    "ParentWeb/LastItemUserModifiedDate" |
    "ParentWeb/ServerRelativeUrl" |
    "ParentWeb/Title" |
    "ParentWeb/WebTemplate" |
    "ParentWeb/WebTemplateId" |
    "ParentWeb/odata.editLink" |
    "ParentWeb/odata.id" |
    "ParentWeb/odata.type" |
    "RecycleBinEnabled" |
    "ResourcePath" |
    "ServerRelativeUrl" |
    "SiteLogoUrl" |
    "SyndicationEnabled" |
    "Title" |
    "TreeViewEnabled" |
    "UIVersion" |
    "UIVersionConfigurationEnabled" |
    "Url" |
    "WebTemplate" |
    "WelcomePage";
export type WebQueryableInterface = QueryableInterface<{
    Alerts: QueryableProp<any, true>;
    AllowAutomaticASPXPageIndexing: QueryableProp<boolean, false>;
    AllowCreateDeclarativeWorkflowForCurrentUser: QueryableProp<boolean, false>;
    AllowDesignerForCurrentUser: QueryableProp<boolean, false>;
    AllowMasterPageEditingForCurrentUser: QueryableProp<boolean, false>;
    AllowRevertFromTemplateForCurrentUser: QueryableProp<boolean, false>;
    AllowRssFeeds: QueryableProp<boolean, false>;
    AllowSaveDeclarativeWorkflowAsTemplateForCurrentUser: QueryableProp<boolean, false>;
    AllowSavePublishDeclarativeWorkflowForCurrentUser: QueryableProp<boolean, false>;
    AllProperties: QueryableProp<any, true>;
    AlternateCssUrl: QueryableProp<string, false>;
    AppInstanceId: QueryableProp<string, false>;
    AssociatedMemberGroup: QueryableProp<any, true>;
    AssociatedOwnerGroup: QueryableProp<any, true>;
    AssociatedVisitorGroup: QueryableProp<any, true>;
    Author: QueryableProp<any, true>;
    AvailableContentTypes: QueryableProp<any, true>;
    AvailableFields: QueryableProp<any, true>;
    Configuration: QueryableProp<number, false>;
    ContentTypes: QueryableProp<any, true>;
    Created: QueryableProp<string, false>;
    CurrentChangeToken: QueryableProp<{StringValue: string}, false>;
    CurrentUser: QueryableProp<any, true>;
    "CurrentUser@odata.navigationLinkUrl": QueryableODataProp<string, "CurrentUser">;
    "CurrentUser/Email": QueryableCompositeProp<string, "CurrentUser", "Email">;
    "CurrentUser/Id": QueryableCompositeProp<number, "CurrentUser", "Id">;
    "CurrentUser/IsEmailAuthenticationGuestUser": QueryableCompositeProp<boolean, "CurrentUser", "IsEmailAuthenticationGuestUser">;
    "CurrentUser/IsHiddenInUI": QueryableCompositeProp<boolean, "CurrentUser", "IsHiddenInUI">;
    "CurrentUser/IsShareByEmailGuestUser": QueryableCompositeProp<boolean, "CurrentUser", "IsShareByEmailGuestUser">;
    "CurrentUser/IsSiteAdmin": QueryableCompositeProp<boolean, "CurrentUser", "IsSiteAdmin">;
    "CurrentUser/LoginName": QueryableCompositeProp<string, "CurrentUser", "LoginName">;
    "CurrentUser/PrincipalType": QueryableCompositeProp<PrincipalType, "CurrentUser", "PrincipalType">;
    "CurrentUser/Title": QueryableCompositeProp<string, "CurrentUser", "Title">;
    "CurrentUser/UserId": QueryableCompositeProp<{ NameId: string, NameIdIssuer: string }, "CurrentUser", "UserId">;
    "CurrentUser/odata.editLink": QueryableCompositeProp<QueryableODataProp<string, any>, "CurrentUser", "odata.editLink">;
    "CurrentUser/odata.id": QueryableCompositeProp<QueryableODataProp<string, any>, "CurrentUser", "odata.id">;
    "CurrentUser/odata.type": QueryableCompositeProp<QueryableODataProp<"SP.User", any>, "CurrentUser", "odata.type">;
    CustomMasterUrl: QueryableProp<string, false>;
    Description: QueryableProp<string, false>;
    DescriptionResource: QueryableProp<any, true>;
    DesignerDownloadUrlForCurrentUser: QueryableProp<string, false>;
    DesignPackageId: QueryableProp<string, false>;
    DocumentLibraryCalloutOfficeWebAppPreviewersDisabled: QueryableProp<boolean, false>;
    EffectiveBasePermissions: QueryableProp<{High: string; Low: string}, false>;
    EnableMinimalDownload: QueryableProp<boolean, false>;
    EventReceivers: QueryableProp<any, true>;
    ExcludeFromOfflineClient: QueryableProp<boolean, false>;
    Features: QueryableProp<any, true>;
    Fields: QueryableProp<any, true>;
    FirstUniqueAncestorSecurableObject: QueryableProp<any, true>;
    Folders: QueryableProp<any, true>;
    FooterEnabled: QueryableProp<boolean, false>;
    HasUniqueRoleAssignments: QueryableProp<boolean, false>;
    HeaderEmphasis: QueryableProp<number, false>;
    HeaderLayout: QueryableProp<number, false>;
    HorizontalQuickLaunch: QueryableProp<boolean, false>;
    Id: QueryableProp<string, false>;
    IsMultilingual: QueryableProp<boolean, false>;
    Language: QueryableProp<number, false>;
    LastItemModifiedDate: QueryableProp<string, false>;
    LastItemUserModifiedDate: QueryableProp<string, false>;
    Lists: QueryableProp<any, true>;
    ListTemplates: QueryableProp<any, true>;
    MasterUrl: QueryableProp<string, false>;
    MegaMenuEnabled: QueryableProp<boolean, false>;
    Navigation: QueryableProp<any, true>;
    NoCrawl: QueryableProp<boolean, false>;
    ObjectCacheEnabled: QueryableProp<boolean, false>;
    OverwriteTranslationsOnChange: QueryableProp<boolean, false>;
    ParentWeb: QueryableProp<any, true>;
    "ParentWeb@odata.navigationLinkUrl": QueryableODataProp<string, "ParentWeb">;
    "ParentWeb/Configuration": QueryableCompositeProp<number, "ParentWeb", "Configuration">;
    "ParentWeb/Created": QueryableCompositeProp<string, "ParentWeb", "Created">;
    "ParentWeb/Description": QueryableCompositeProp<string, "ParentWeb", "Description">;
    "ParentWeb/Id": QueryableCompositeProp<string, "ParentWeb", "Id">;
    "ParentWeb/Language": QueryableCompositeProp<number, "ParentWeb", "Language">;
    "ParentWeb/LastItemModifiedDate": QueryableCompositeProp<string, "ParentWeb", "LastItemModifiedDate">;
    "ParentWeb/LastItemUserModifiedDate": QueryableCompositeProp<string, "ParentWeb", "LastItemUserModifiedDate">;
    "ParentWeb/ServerRelativeUrl": QueryableCompositeProp<string, "ParentWeb", "ServerRelativeUrl">;
    "ParentWeb/Title": QueryableCompositeProp<string, "ParentWeb", "Title">;
    "ParentWeb/WebTemplate": QueryableCompositeProp<string, "ParentWeb", "WebTemplate">;
    "ParentWeb/WebTemplateId": QueryableCompositeProp<number, "ParentWeb", "WebTemplateId">;
    "ParentWeb/odata.editLink": QueryableCompositeProp<QueryableODataProp<string, any>, "ParentWeb", "odata.editLink">;
    "ParentWeb/odata.id": QueryableCompositeProp<QueryableODataProp<string, any>, "ParentWeb", "odata.id">;
    "ParentWeb/odata.type": QueryableCompositeProp<QueryableODataProp<"SP.WebInfo", any>, "ParentWeb", "odata.type">;
    PushNotificationSubscribers: QueryableProp<any, true>;
    QuickLaunchEnabled: QueryableProp<boolean, false>;
    RecycleBin: QueryableProp<any, true>;
    RecycleBinEnabled: QueryableProp<boolean, false>;
    RegionalSettings: QueryableProp<any, true>;
    RequestAccessEmail: QueryableProp<string, false>;
    ResourcePath: QueryableProp<{DecodedUrl: string}, false>;
    RoleAssignments: QueryableProp<any, true>;
    RoleDefinitions: QueryableProp<any, true>;
    RootFolder: QueryableProp<any, true>;
    SaveSiteAsTemplateEnabled: QueryableProp<boolean, false>;
    ServerRelativeUrl: QueryableProp<string, false>;
    ShowUrlStructureForCurrentUser: QueryableProp<boolean, false>;
    SiteGroups: QueryableProp<any, true>;
    SiteLogoDescription: QueryableProp<string, false>;
    SiteLogoUrl: QueryableProp<string, false>;
    SiteUserInfoList: QueryableProp<any, true>;
    SiteUsers: QueryableProp<any, true>;
    SupportedUILanguageIds: QueryableProp<number[], false>;
    SyndicationEnabled: QueryableProp<boolean, false>;
    ThemedCssFolderUrl: QueryableProp<string, false>;
    ThemeInfo: QueryableProp<any, true>;
    Title: QueryableProp<string, false>;
    TitleResource: QueryableProp<any, true>;
    TreeViewEnabled: QueryableProp<boolean, false>;
    UIVersion: QueryableProp<number, false>;
    UIVersionConfigurationEnabled: QueryableProp<boolean, false>;
    Url: QueryableProp<string, false>;
    UserCustomActions: QueryableProp<any, true>;
    Webs: QueryableProp<any, true>;
    WebTemplate: QueryableProp<string, false>;
    WelcomePage: QueryableProp<string, false>;
    WorkflowAssociations: QueryableProp<any, true>;
    WorkflowTemplates: QueryableProp<any, true>;
    "odata.editLink": QueryableODataProp<string, any>;
    "odata.id": QueryableODataProp<string, any>;
    "odata.metadata": QueryableODataProp<string, any>;
    "odata.type": QueryableODataProp<"SP.Web", any>;
}, WebDefaultSelectedKeys, never>;
