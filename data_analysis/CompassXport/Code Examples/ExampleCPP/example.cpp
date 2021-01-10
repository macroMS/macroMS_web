// example.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#ifdef _DEBUG
#define new DEBUG_NEW
#endif

// TODO: in order for this example to work, CompassXport must be installed. Here it is
// assumed that the dll is installed to the path below. Adjust this path according
// to your installation location.
#import "C:\Program Files\Common Files\Bruker Daltonik\AIDA\export\CompassXport.dll"


int example(int argc, TCHAR* argv[])
{
	CString sInput;
	CString sOutput;
	
	//check arguments
	if ( 3 == argc )
	{
		//argv[0] is the program name itself
		sInput = argv[1];
		sOutput = argv[2];
	}
	else
	{
		std::cout << "usage: [input file name] [output file name]" << std::endl;
		std::cout << "full directory + file name (e.g. .\\analysis.baf) needed!" << std::endl;
		return -1;
	}

	//create the converter object
	mzXMLCOMLib::ImzXMLConverter3Ptr pConverter;
	HRESULT hr = pConverter.CreateInstance( __uuidof(mzXMLCOMLib::mzXMLConverter) );	

	//call CompassXport (with correct BSTRs)
	BSTR bstrInput( sInput.AllocSysString() );
	BSTR bstrsOutput( sOutput.AllocSysString() );
	pConverter->ConvertAndLog2(bstrInput, bstrsOutput, 2, TRUE);	
	
	//here, ConvertAndLog2 is used. See the VBS examples or ReleaseNotes.txt for more possibilities.

	return system("PAUSE");
}

///////////////////////////////////////////////////////////////////////////////

CWinApp theApp;

using namespace std;

int _tmain(int argc, TCHAR* argv[], TCHAR* envp[])
{
	int nRetCode = 0;

	// initialize MFC and print and error on failure
	if (!AfxWinInit(::GetModuleHandle(NULL), NULL, ::GetCommandLine(), 0))
	{
		// TODO: change error code to suit your needs
		_tprintf(_T("Fatal Error: MFC initialization failed\n"));
		nRetCode = 1;
	}
	else
	{
		CoInitialize(NULL);
		nRetCode = example(argc, argv);
		CoUninitialize();
	}

	return nRetCode;
}
